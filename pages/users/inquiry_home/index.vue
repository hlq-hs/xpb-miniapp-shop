<template>
	<view class="inquiry-home">
		<view class="page-body">
			<view class="brand-block">
				<image
					v-if="mobileLoginLogo"
					class="brand-image"
					:src="mobileLoginLogo"
					mode="widthFix"
					@load="handleBrandReady"
					@error="handleBrandReady"
				></image>
				<view v-else class="brand-fallback">
					<view class="brand-mark">A</view>
					<view class="brand-copy">
						<text class="brand-name">透明修车</text>
						<text class="brand-sub">成本询价系统</text>
					</view>
				</view>
			</view>

			<view class="hero">
				<text class="hero-welcome">欢迎使用</text>
				<text class="hero-title">透明修车</text>
				<text class="hero-title hero-title-last">成本询价系统</text>
			</view>

			<view class="address-card address-card-modern" @click="chooseAddress">
				<view class="address-accent"></view>
				<view class="address-icon">
					<text class="iconfont icon-dizhi address-icon-glyph"></text>
				</view>
				<view class="address-copy">
					<view class="address-card-head">
						<text class="address-card-title">收货地址</text>
						<text class="address-card-action">{{ selectedAddress.id ? '更换' : '去选择' }}</text>
					</view>
					<template v-if="selectedAddress.id">
						<text class="address-contact">{{ selectedAddress.realName }} {{ selectedAddress.phone }}</text>
						<text class="address-detail">{{ selectedAddressText }}</text>
					</template>
					<text v-else class="address-empty">请选择收货地址</text>
				</view>
			</view>

			<view class="menu-list">
				<view class="menu-card theme-blue" @click="handleTap('quote')">
					<view class="menu-accent"></view>
					<view class="menu-icon">
						<image class="menu-icon-image" src="/static/images/inquiry_quote_icon.svg" mode="aspectFit"></image>
					</view>
					<view class="menu-copy">
						<text class="menu-title">询价</text>
						<text class="menu-desc">提交车辆和配件信息</text>
					</view>
					<view class="menu-arrow">
						<image class="menu-arrow-image" src="/static/images/inquiry_arrow_icon.svg" mode="aspectFit"></image>
					</view>
				</view>

				<view class="menu-card theme-orange" @click="handleTap('history')">
					<view class="menu-accent"></view>
					<view class="menu-icon">
						<image class="menu-icon-image" src="/static/images/inquiry_history_icon.svg" mode="aspectFit"></image>
					</view>
					<view class="menu-copy">
						<text class="menu-title">询价历史</text>
						<text class="menu-desc">查看历史询价记录</text>
					</view>
					<view class="menu-arrow">
						<image class="menu-arrow-image" src="/static/images/inquiry_arrow_icon.svg" mode="aspectFit"></image>
					</view>
				</view>

				<view v-if="false" class="menu-card theme-purple" @click="handleTap('vehicle')">
					<view class="menu-accent"></view>
					<view class="menu-icon">
						<image class="menu-icon-image" src="/static/images/inquiry_vehicle_icon.svg" mode="aspectFit"></image>
					</view>
					<view class="menu-copy">
						<text class="menu-title">历史车辆</text>
						<text class="menu-desc">查看车辆记录 · 管理爱车</text>
					</view>
					<view class="menu-arrow">
						<image class="menu-arrow-image" src="/static/images/inquiry_arrow_icon.svg" mode="aspectFit"></image>
					</view>
				</view>

				<view class="menu-card theme-green" @click="handleTap('order')">
					<view class="menu-accent"></view>
					<view class="menu-icon">
						<image class="menu-icon-image" src="/static/images/inquiry_order_icon.svg" mode="aspectFit"></image>
					</view>
					<view class="menu-copy">
						<text class="menu-title">询价订单</text>
						<text class="menu-desc">查看报价和订单进度</text>
					</view>
					<view class="menu-arrow">
						<image class="menu-arrow-image" src="/static/images/inquiry_arrow_icon.svg" mode="aspectFit"></image>
					</view>
				</view>
			</view>
		</view>

		<view v-if="isPageLoading" class="loading-mask">
			<view class="loading-panel">
				<view class="loading-spinner"></view>
				<text class="loading-text">加载中</text>
			</view>
		</view>
	</view>
</template>

<script>
import {
	getAddressList
} from '@/api/user.js';
import { getUserCarList } from '@/api/userCar.js';

const app = getApp();
const INQUIRY_BRAND_LOGO =
	'https://xpb.cn-shenzhen.oss.aliyuncs.com/235235/pt202606131521008882045749894.jpg?versionId=CAEQdBiBgICs_LX_9RkiIDEwYjlkYTRkYjU2YTQ5MTA4YjZiOTUzYzFiMWRmNWYx';

export default {
	data() {
		const initialLogo = INQUIRY_BRAND_LOGO || (app && app.globalData ? app.globalData.mobileLoginLogo : '');
		return {
			statusBarHeight: 20,
			navContentHeight: 44,
			mobileLoginLogo: initialLogo,
			isPageLoading: true,
			isViewReady: false,
			isBrandReady: !initialLogo,
			selectedAddress: {},
			hasSavedAddress: null,
			checkingVehicle: false
		};
	},
	computed: {
		navTotalHeight() {
			return this.statusBarHeight + this.navContentHeight;
		},
		selectedAddressText() {
			const address = this.selectedAddress || {};
			return [address.province, address.city, address.district, address.detail].filter(Boolean).join(' ');
		}
	},
	onLoad() {
		const info = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {};
		const statusBarHeight = info.statusBarHeight || 20;
		let navContentHeight = 44;

		// #ifdef MP-WEIXIN
		const menuButton = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null;
		if (menuButton && menuButton.height) {
			navContentHeight = Math.max(menuButton.height + 12, 44);
		}
		// #endif

		this.statusBarHeight = statusBarHeight;
		this.navContentHeight = navContentHeight;
	},
	onReady() {
		this.isViewReady = true;
		this.tryHideLoading();
	},
	onShow() {
		const selectedAddress = uni.getStorageSync('inquirySelectedAddress');
		if (selectedAddress && selectedAddress.id) {
			this.selectedAddress = selectedAddress;
			uni.removeStorageSync('inquirySelectedAddress');
			return;
		}
		if (!this.selectedAddress.id) {
			this.loadDefaultAddress();
		}
	},
	methods: {
		handleBrandReady() {
			this.isBrandReady = true;
			this.tryHideLoading();
		},
		tryHideLoading() {
			if (this.isViewReady && this.isBrandReady) {
				this.isPageLoading = false;
			}
		},
		handleBack() {
			if (getCurrentPages().length > 1) {
				uni.navigateBack({
					delta: 1
				});
				return;
			}
			uni.showToast({
				title: 'Back',
				icon: 'none'
			});
		},
		loadDefaultAddress() {
			getAddressList({
				page: 1,
				limit: 20
			}).then(res => {
				const list = res && res.data && res.data.list ? res.data.list : [];
				if (!list.length) {
					this.selectedAddress = {};
					this.hasSavedAddress = false;
					return;
				}
				this.hasSavedAddress = true;
				this.selectedAddress = list.find(item => item.isDefault) || list[0];
			}).catch(() => {
				this.selectedAddress = {};
				this.hasSavedAddress = null;
			});
		},
		chooseAddress() {
			uni.navigateTo({
				url: this.hasSavedAddress === false
					? '/pages/users/user_address/index?selectType=inquiry'
					: '/pages/users/user_address_list/index?selectType=inquiry'
			});
		},
		checkVehicleAndEnterQuote() {
			if (this.checkingVehicle) return;
			this.checkingVehicle = true;
			uni.showLoading({
				title: '检查车辆信息',
				mask: true
			});
			getUserCarList({
				page: 1,
				limit: 1,
				uid: this.$store.state.app.uid || ''
			}).then((res) => {
				const pageData = (res && res.data) || {};
				const list = Array.isArray(pageData.list) ? pageData.list : [];
				uni.navigateTo({
					url: list.length
						? '/pages/users/inquiry_quote/index'
						: '/pages/users/vehicle_manage/index?add=1&from=inquiry'
				});
			}).catch((err) => {
				uni.showToast({
					title: (err && (err.message || err.msg)) || err || '车辆信息加载失败',
					icon: 'none'
				});
			}).finally(() => {
				this.checkingVehicle = false;
				uni.hideLoading();
			});
		},
		handleQuoteEntry() {
			uni.removeStorageSync('inquirySelectedAddress');
			uni.showLoading({
				title: '加载中',
				mask: true
			});
			getAddressList({
				page: 1,
				limit: 20
			}).then(res => {
				const list = res && res.data && res.data.list ? res.data.list : [];
				uni.setStorageSync('pendingInquiryQuoteAddressSelect', 1);
				uni.navigateTo({
					url: list.length
						? '/pages/users/user_address_list/index?selectType=inquiry'
						: '/pages/users/user_address/index?selectType=inquiry'
				});
			}).catch(() => {
				uni.showToast({
					title: '地址加载失败',
					icon: 'none'
				});
			}).finally(() => {
				uni.hideLoading();
			});
		},
		handleTap(type) {
			if (type === 'quote') {
				if (!this.selectedAddress || !this.selectedAddress.id) {
					uni.showToast({
						title: '请先选择收货地址',
						icon: 'none'
					});
					return;
				}
				this.checkVehicleAndEnterQuote();
				return;
			}
			if (type === 'history') {
				uni.navigateTo({
					url: '/pages/users/inquiry_history/index'
				});
				return;
			}
			if (type === 'vehicle') {
				uni.showToast({
					title: '页面正在开发中',
					icon: 'none'
				});
				return;
			}
			if (type === 'order') {
				uni.navigateTo({
					url: '/pages/users/inquiry_order_list/index'
				});
				return;
			}
			uni.showToast({
				title: 'Coming soon',
				icon: 'none'
			});
		}
	}
};
</script>

<style scoped lang="scss">
.inquiry-home {
	min-height: 100vh;
	background:
		radial-gradient(circle at 50% 34%, rgba(45, 97, 191, 0.08), rgba(45, 97, 191, 0) 26%),
		linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
	box-sizing: border-box;
}

.nav-shell {
	background: #ffffff;
}

.nav-row {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 36rpx;
}

.nav-back {
	position: absolute;
	left: 22rpx;
	top: 50%;
	width: 60rpx;
	height: 60rpx;
	transform: translateY(-50%);
}

.nav-back-line {
	position: absolute;
	left: 16rpx;
	width: 4rpx;
	height: 30rpx;
	background: #172840;
	border-radius: 999rpx;
	transform-origin: center;
}

.nav-back-line-top {
	top: 10rpx;
	transform: rotate(45deg);
}

.nav-back-line-bottom {
	top: 28rpx;
	transform: rotate(-45deg);
}

.nav-title {
	max-width: 64%;
	font-size: 34rpx;
	font-weight: 500;
	line-height: 1;
	color: #172840;
	text-align: center;
}

.page-body {
	padding: 26rpx 34rpx 72rpx;
}

.brand-block {
	min-height: 54rpx;
	transform: translateY(-10rpx);
}

.brand-image {
	width: 320rpx;
	display: block;
}

.brand-fallback {
	display: inline-flex;
	align-items: center;
}

.brand-mark {
	width: 48rpx;
	height: 48rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #eef5ff 0%, #d8e7ff 100%);
	color: #1c57b8;
	font-size: 30rpx;
	font-weight: 700;
}

.brand-copy {
	display: flex;
	align-items: baseline;
	margin-left: 10rpx;
}

.brand-name {
	font-size: 28rpx;
	font-weight: 700;
	color: #2b5cab;
}

.brand-sub {
	margin-left: 8rpx;
	font-size: 18rpx;
	color: #6682b1;
}

.hero {
	transform: translateY(-72rpx);
	padding: 122rpx 18rpx 48rpx;
	text-align: center;
}

.hero-welcome {
	display: block;
	font-size: 42rpx;
	line-height: 1.2;
	color: #5f6d80;
}

.hero-title {
	display: block;
	margin-top: 12rpx;
	font-size: 70rpx;
	line-height: 1.08;
	font-weight: 800;
	color: #1152b5;
}

.hero-title-last {
	margin-top: 6rpx;
}

.address-card {
	position: relative;
	transform: translateY(-72rpx);
	display: flex;
	align-items: center;
	min-height: 146rpx;
	padding: 0 22rpx 0 0;
	border-radius: 40rpx;
	background: rgba(255, 255, 255, 0.98);
	box-shadow: 0 18rpx 44rpx rgba(40, 62, 98, 0.08);
	overflow: hidden;
}

.address-card + .address-card {
	display: none;
}

.address-accent {
	width: 8rpx;
	align-self: stretch;
	border-radius: 40rpx 0 0 40rpx;
	background: linear-gradient(180deg, #2d89bd 0%, #2f6fb3 100%);
}

.address-icon {
	width: 84rpx;
	height: 84rpx;
	margin-left: 26rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #eef3fb;
	flex-shrink: 0;
}

.address-icon-glyph {
	font-size: 38rpx;
	color: #4d8fe7;
	line-height: 1;
}

.address-copy {
	flex: 1;
	min-width: 0;
	margin-left: 20rpx;
	padding: 18rpx 0;
}

.address-card-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 20rpx;
}

.address-card-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #172840;
	line-height: 1.25;
}

.address-card-action {
	flex-shrink: 0;
	font-size: 24rpx;
	color: #9aa6b7;
}

.address-contact {
	display: block;
	margin-top: 6rpx;
	font-size: 28rpx;
	font-weight: 600;
	line-height: 1.3;
	color: #172840;
}

.address-detail {
	display: block;
	margin-top: 4rpx;
	font-size: 24rpx;
	line-height: 1.35;
	color: #9aa6b7;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.address-empty {
	display: block;
	margin-top: 6rpx;
	font-size: 24rpx;
	line-height: 1.35;
	color: #9aa6b7;
}

.menu-list {
	margin-top: -20rpx;
	display: flex;
	flex-direction: column;
	row-gap: 36rpx;
}

.menu-card {
	position: relative;
	display: flex;
	align-items: center;
	min-height: 146rpx;
	padding: 0 22rpx 0 0;
	border-radius: 40rpx;
	background: rgba(255, 255, 255, 0.98);
	box-shadow: 0 18rpx 44rpx rgba(40, 62, 98, 0.08);
	overflow: hidden;
}

.menu-accent {
	width: 8rpx;
	align-self: stretch;
	border-radius: 40rpx 0 0 40rpx;
}

.menu-icon {
	width: 92rpx;
	height: 92rpx;
	margin-left: 26rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #eef3fb;
	flex-shrink: 0;
}

.menu-icon-image {
	width: 60rpx;
	height: 60rpx;
	display: block;
}

.menu-copy {
	flex: 1;
	min-width: 0;
	margin-left: 24rpx;
}

.menu-title {
	display: block;
	font-size: 38rpx;
	font-weight: 700;
	line-height: 1.25;
	color: #172840;
}

.menu-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 28rpx;
	line-height: 1.4;
	color: #9aa6b7;
}

.menu-arrow {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #eef3fb;
	flex-shrink: 0;
}

.menu-arrow-image {
	width: 52rpx;
	height: 52rpx;
	display: block;
}

.theme-blue .menu-accent {
	background: linear-gradient(180deg, #2d89bd 0%, #2f6fb3 100%);
}

.theme-orange .menu-accent {
	background: linear-gradient(180deg, #f5a02d 0%, #eb7d18 100%);
}

.theme-purple .menu-accent {
	background: linear-gradient(180deg, #b75ac5 0%, #8f3eb7 100%);
}

.theme-green .menu-accent {
	background: linear-gradient(180deg, #32c879 0%, #27a85c 100%);
}

.loading-mask {
	position: fixed;
	inset: 0;
	z-index: 999;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.92);
}

.loading-panel {
	display: flex;
	flex-direction: column;
	align-items: center;
	row-gap: 18rpx;
}

.loading-spinner {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	border: 6rpx solid rgba(29, 125, 240, 0.16);
	border-top-color: #1d7df0;
	animation: spin 0.9s linear infinite;
}

.loading-text {
	font-size: 28rpx;
	color: #6b7788;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
}
</style>
