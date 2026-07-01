<template>
	<view class="parts-page">
		<view class="parts-body">
			<view class="vehicle-card">
				<text class="vehicle-name vehicle-name-dynamic">{{ vehicleName }}</text>
				<text class="vehicle-vin">VIN: {{ vinCode }}</text>
			</view>

			<view class="search-box">
				<input
					v-model="keyword"
					class="search-input"
					type="text"
					placeholder="输入配件名称或OE号"
					placeholder-class="search-placeholder"
				/>
			</view>

			<view class="selection-layout">
				<view class="selected-panel">
					<view class="panel-title">已添加配件 ({{ selectedParts.length }})</view>
					<view class="selected-list">
						<view v-if="!selectedParts.length" class="selected-empty">暂无已选配件</view>
						<view
							v-for="part in selectedParts"
							:key="part"
							class="selected-item"
							@click="togglePart(part)"
						>
							<text>{{ part }}</text>
							<text class="remove-mark">×</text>
						</view>
					</view>
				</view>

				<scroll-view scroll-y class="catalog-panel">
					<view v-for="group in filteredGroups" :key="group.title" class="part-group">
						<view class="group-title">
							<text>{{ group.title }}</text>
							<view class="group-line"></view>
						</view>
						<view class="part-grid">
							<view
								v-for="part in group.parts"
								:key="part"
								class="part-chip"
								:class="{ selected: isSelected(part) }"
								@click="togglePart(part)"
							>
								{{ part }}
							</view>
						</view>
					</view>
					<view v-if="showCustomAdd" class="custom-add-card" @click="addCustomPart">
						<text class="custom-add-tip">未找到“{{ keyword.trim() }}”</text>
						<text class="custom-add-link">点击添加此配件</text>
					</view>
					<view v-else-if="!filteredGroups.length" class="catalog-empty">暂无匹配配件</view>
				</scroll-view>
			</view>
		</view>

		<view class="bottom-bar">
			<view class="next-btn" @click="handleNext">下一步</view>
		</view>
	</view>
</template>

<script>
import { getAddressList } from '@/api/user.js';

const PART_GROUPS = [
	{
		title: '常用配件',
		parts: ['机油格', '空气格', '空调格', '燃油滤清器', '前刹车片', '后刹车片', '前刹车碟', '后刹车碟', '火花塞', '前保险杠', '后保险杠', '左前叶子板', '右前叶子板', '左后叶子板', '右后叶子板', '中网', '前刹车感应线', '后刹车感应线', '左前减震', '右前减震', '左后减震', '右后减震', '平衡杆球头']
	},
	{
		title: '保养、易损件',
		parts: ['机油格', '空气格', '空调格', '燃油滤清器', '轮胎', '蓄电池', '前刹车片', '后刹车片', '前刹车碟', '后刹车碟', '左前雨刮片', '右前雨刮片', '前刹车感应线', '后刹车感应线', '火花塞', '发动机皮带', '离合器片', '离合器压盘', '分离轴承', '灯泡']
	},
	{
		title: '事故件',
		parts: ['前保险杠', '后保险杠', '左前叶子板', '右前叶子板', '左后叶子板', '右后叶子板', '中网', '尾盖', '保险杠格栅', '前挡风玻璃', '后挡风玻璃', '左前大灯', '右前大灯', '机盖', '前门', '后门', '雾灯', '尾灯', '保险杠支架', '泡沫', '大灯喷水马达', '保险杠拖车盖', '大灯喷水盖', '雾灯罩']
	},
	{
		title: '维修件',
		parts: ['前刹车片', '后刹车片', '火花塞', '前刹车感应线', '后刹车感应线', '前刹车碟', '后刹车碟', '左前下摆臂', '右前下摆臂', '左后下摆臂', '右后下摆臂', '水泵', '节温器', '左前减震', '右前减震', '左后减震', '右后减震', '波箱滤网', '波箱油底壳垫', '发动机皮带', '左前雨刮片', '右前雨刮片', '平衡杆球头', '玻璃升降机', '点火线圈']
	}
];

export default {
	data() {
		return {
			statusBarHeight: 20,
			navContentHeight: 44,
			vehicleName: 'VW EOS 2012 2.0TSI',
			vinCode: 'WVWSR31FXCV012344',
			externalInquiryId: '',
			keyword: '',
			selectedParts: [],
			partGroups: PART_GROUPS,
			isSubmitting: false,
			selectedAddress: {},
			vehicleInfo: {}
		};
	},
	computed: {
		navTotalHeight() {
			return this.statusBarHeight + this.navContentHeight;
		},
		filteredGroups() {
			const keyword = this.keyword.trim().toLowerCase();
			if (!keyword) return this.partGroups;
			return this.partGroups
				.map(group => ({
					title: group.title,
					parts: group.parts.filter(part => part.toLowerCase().includes(keyword))
				}))
				.filter(group => group.parts.length);
		},
		showCustomAdd() {
			return !!this.keyword.trim() && !this.filteredGroups.length;
		}
	},
	onLoad(options) {
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
		if (options && options.externalInquiryId) {
			this.externalInquiryId = decodeURIComponent(options.externalInquiryId);
		}
		if (options && options.vehicleName) {
			this.vehicleName = decodeURIComponent(options.vehicleName);
		}
		if (options && options.vin) {
			this.vinCode = decodeURIComponent(options.vin);
		}
		this.vehicleInfo = uni.getStorageSync('inquiryVehicleInfo') || {};
		if (!this.vehicleName) {
			this.vehicleName =
				this.vehicleInfo.saleModelName ||
				this.vehicleInfo.carModelName ||
				this.vehicleInfo.vehicleName ||
				this.vehicleName;
		}
		if (!this.vinCode) {
			this.vinCode = this.vehicleInfo.vin || this.vehicleInfo.vinCode || this.vinCode;
		}
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
		handleBack() {
			uni.navigateBack({ delta: 1 });
		},
		loadDefaultAddress() {
			getAddressList({
				page: 1,
				limit: 20
			}).then(res => {
				const list = res && res.data && res.data.list ? res.data.list : [];
				this.selectedAddress = list.find(item => item.isDefault) || list[0] || {};
			}).catch(() => {
				this.selectedAddress = {};
			});
		},
		isSelected(part) {
			return this.selectedParts.includes(part);
		},
		togglePart(part) {
			const index = this.selectedParts.indexOf(part);
			if (index >= 0) {
				this.selectedParts.splice(index, 1);
				return;
			}
			this.selectedParts.push(part);
		},
		addCustomPart() {
			const customPart = this.keyword.trim();
			if (!customPart) return;
			if (!this.selectedParts.includes(customPart)) {
				this.selectedParts.push(customPart);
			}
			this.keyword = '';
		},
		getLongitude() {
			return String(
				this.selectedAddress.longitude ||
				this.selectedAddress.longitudeX ||
				uni.getStorageSync('user_longitude') ||
				''
			);
		},
		getLatitude() {
			return String(
				this.selectedAddress.latitude ||
				this.selectedAddress.dimensionY ||
				uni.getStorageSync('user_latitude') ||
				''
			);
		},
		buildBatchDecodePayload() {
			const getters = (this.$store && this.$store.getters) || {};
			const userInfo = getters.userInfo || {};
			const uid = getters.uid || 0;
			const vehicleInfo = this.vehicleInfo || {};
			const carBrandName = vehicleInfo.carBrandName || vehicleInfo.brandName || '未知品牌';
			const carModelName = vehicleInfo.saleModelName || vehicleInfo.carModelName || this.vehicleName || '未知车型';
			return {
				userId: Number(uid) || 0,
				mobile: userInfo.phone || '',
				userName: userInfo.nickname || userInfo.realName || '',
				contactName: this.selectedAddress.realName || userInfo.nickname || '未填写',
				contactNumber: this.selectedAddress.phone || userInfo.phone || '',
				provinceGeoName: this.selectedAddress.province || '',
				cityGeoName: this.selectedAddress.city || '',
				countyGeoName: this.selectedAddress.district || '',
				villageGeoName: this.selectedAddress.street || this.selectedAddress.district || this.selectedAddress.city || '',
				address: this.selectedAddress.detail || '',
				longitude: this.getLongitude(),
				latitude: this.getLatitude(),
				vin: this.vinCode,
				oeList: this.selectedParts.slice(),
				carBrandId: String(vehicleInfo.carBrandCode || vehicleInfo.carBrandId || vehicleInfo.brandId || vehicleInfo.levelId || 'UNKNOWN'),
				carBrandName,
				carModelName,
				openInvoiceType: 'NO',
				quotedType: 'AUTO'
			};
		},
		requestBatchDecode(payload) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/vin-batchdecode',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: payload,
					success: (res) => {
						resolve((res && res.data) || {});
					},
					fail: reject
				});
			});
		},
		async handleNext() {
			if (!this.selectedParts.length) {
				uni.showToast({
					title: '请先选择配件',
					icon: 'none'
				});
				return;
			}
			if (!this.selectedAddress.realName || !this.selectedAddress.phone || !this.selectedAddress.province || !this.selectedAddress.city || !this.selectedAddress.district || !this.selectedAddress.detail) {
				uni.showToast({
					title: '请先完善收货地址',
					icon: 'none'
				});
				return;
			}
			if (!this.getLongitude() || !this.getLatitude()) {
				uni.showToast({
					title: '缺少经纬度，请先授权定位',
					icon: 'none'
				});
				return;
			}
			if (this.isSubmitting) return;

			this.isSubmitting = true;
			uni.showLoading({
				title: '译码中',
				mask: true
			});

			try {
				const result = await this.requestBatchDecode(this.buildBatchDecodePayload());
				if (result && result.msgid && Number(result.msgid) !== 200) {
					uni.showToast({
						title: result.msgtext || '译码失败，请稍后重试',
						icon: 'none'
					});
					return;
				}
				uni.setStorageSync('inquiryBatchDecodeResult', result && result.data ? result.data : []);
			} catch (error) {
				uni.showToast({
					title: '译码失败，请稍后重试',
					icon: 'none'
				});
				return;
			} finally {
				this.isSubmitting = false;
				uni.hideLoading();
			}

			uni.setStorageSync('inquirySelectedParts', this.selectedParts);
			uni.navigateTo({
				url: `/pages/users/inquiry_submit/index?vin=${encodeURIComponent(this.vinCode)}&externalInquiryId=${encodeURIComponent(this.externalInquiryId || '')}`
			});
		}
	}
};
</script>

<style scoped lang="scss">
.parts-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f4f4f4;
	overflow: hidden;
}

.nav-shell {
	flex-shrink: 0;
	background: #303030;
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
	border-radius: 999rpx;
	background: #ffffff;
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
	font-size: 36rpx;
	font-weight: 500;
	color: #ffffff;
}

.parts-body {
	flex: 1;
	min-height: 0;
	padding: 22rpx 18rpx 140rpx;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	overflow: hidden;
}

.vehicle-card {
	padding: 20rpx 24rpx;
	border-radius: 16rpx;
	background: #ffffff;
	box-shadow: 0 8rpx 20rpx rgba(40, 47, 58, 0.06);
}

.vehicle-name {
	display: block;
	font-size: 29rpx;
	font-weight: 600;
	line-height: 1.45;
	color: #24272d;
}

.vehicle-vin {
	display: block;
	margin-top: 6rpx;
	font-size: 25rpx;
	color: #85898f;
}

.search-box {
	margin-top: 24rpx;
	height: 70rpx;
	padding: 0 28rpx;
	border: 2rpx solid #d6d6d6;
	border-radius: 36rpx;
	background: #ffffff;
}

.search-input {
	height: 70rpx;
	font-size: 27rpx;
	color: #33373d;
}

.search-placeholder {
	color: #8c8f94;
}

.selection-layout {
	flex: 1;
	min-height: 0;
	margin-top: 20rpx;
	display: flex;
	align-items: flex-start;
	column-gap: 16rpx;
	padding-bottom: 24rpx;
	overflow: hidden;
}

.selected-panel,
.catalog-panel {
	border-radius: 14rpx;
	background: #ffffff;
	box-shadow: 0 8rpx 20rpx rgba(40, 47, 58, 0.05);
	box-sizing: border-box;
}

.selected-panel {
	flex: 0 0 38%;
	height: 100%;
	min-width: 0;
	overflow: hidden;
	align-self: flex-start;
}

.panel-title {
	flex-shrink: 0;
	padding: 24rpx 18rpx;
	border-bottom: 1rpx solid #ededed;
	font-size: 28rpx;
	font-weight: 600;
	color: #282b30;
}

.selected-list {
	padding: 18rpx 14rpx;
	box-sizing: border-box;
}

.selected-empty {
	padding-top: 44rpx;
	text-align: center;
	font-size: 25rpx;
	color: #a5a8ad;
}

.selected-item {
	margin-bottom: 12rpx;
	padding: 16rpx 14rpx;
	border-radius: 10rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: 25rpx;
	color: #4b4f55;
	background: #f5f6f7;
}

.remove-mark {
	margin-left: 8rpx;
	font-size: 30rpx;
	color: #ff5950;
}

.catalog-panel {
	flex: 1;
	height: 100%;
	min-width: 0;
	padding: 22rpx 18rpx;
}

.part-group {
	margin-bottom: 26rpx;
}

.group-title {
	display: inline-flex;
	flex-direction: column;
	margin-bottom: 16rpx;
	font-size: 29rpx;
	font-weight: 700;
	color: #26292f;
}

.group-line {
	width: 100%;
	height: 3rpx;
	margin-top: 8rpx;
	border-radius: 999rpx;
	background: #1589d0;
}

.part-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12rpx;
}

.part-chip {
	min-height: 64rpx;
	padding: 8rpx 6rpx;
	border: 1rpx solid #e5e5e5;
	border-radius: 10rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	font-size: 22rpx;
	line-height: 1.25;
	color: #43474d;
	background: #f8f8f8;
	box-sizing: border-box;
}

.part-chip.selected {
	border-color: #1787ef;
	color: #1478d4;
	background: #eaf4ff;
}

.custom-add-card {
	margin-top: 6rpx;
	padding: 48rpx 24rpx;
	border-radius: 18rpx;
	text-align: center;
	background: #fafafa;
	box-shadow: inset 0 0 0 1rpx #f0f1f3;
}

.custom-add-tip {
	display: block;
	font-size: 28rpx;
	line-height: 1.7;
	color: #666d76;
}

.custom-add-link {
	display: block;
	font-size: 28rpx;
	font-weight: 600;
	line-height: 1.7;
	color: #1787ef;
}

.catalog-empty {
	padding-top: 100rpx;
	text-align: center;
	font-size: 25rpx;
	color: #a5a8ad;
}

.bottom-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 20;
	padding: 16rpx 18rpx calc(16rpx + env(safe-area-inset-bottom));
	background: #f4f4f4;
	box-shadow: 0 -8rpx 20rpx rgba(40, 47, 58, 0.05);
}

.next-btn {
	height: 82rpx;
	border-radius: 42rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	font-weight: 600;
	color: #ffffff;
	background: #1183f4;
	box-shadow: 0 12rpx 24rpx rgba(17, 131, 244, 0.2);
}
</style>
