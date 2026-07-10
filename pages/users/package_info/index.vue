<template>
	<view class="package-page">
		<view v-if="loading" class="loading-mask">
			<view class="loading-card">
				<view class="loading-spinner"></view>
				<text class="loading-text">加载中...</text>
			</view>
		</view>

		<view v-if="errorMessage" class="error-card">
			<text class="error-title">Error</text>
			<text class="error-text">{{ errorMessage }}</text>
		</view>

		<view v-if="packageList.length" class="package-list">
			<view
				v-for="(pkg, pkgIndex) in packageList"
				:key="pkgIndex"
				class="package-card"
				:class="pkgIndex % 2 === 0 ? 'theme-blue' : 'theme-green'"
				@click="openPackagePlans(pkg)"
			>
				<view class="card-header">
					<view class="header-left">
						<view class="header-icon-wrap">
							<text class="iconfont header-icon" :class="headerIconClass"></text>
						</view>
						<text class="header-title">{{ packageTitle }}</text>
					</view>
					<text class="card-index">{{ formatIndex(pkgIndex) }}</text>
				</view>

				<view class="field-list">
					<view v-for="item in getPackageFields(pkg)" :key="item.key" class="field-row">
						<view class="field-left">
							<view class="field-icon-wrap">
								<text class="iconfont field-icon" :class="item.icon"></text>
							</view>
							<text class="field-key">{{ item.key }}</text>
						</view>
						<text class="field-value">{{ item.value }}</text>
					</view>
				</view>
			</view>
		</view>

		<view v-else-if="!loading && !errorMessage" class="empty-card">
			<text class="empty-text">暂无数据</text>
		</view>

		<view v-if="packageList.length" class="loadmore-box">
			<text v-if="loadingMore" class="loadmore-text">加载更多中...</text>
			<text v-else-if="hasMore" class="loadmore-text">上滑继续加载</text>
			<text v-else class="loadmore-text">已经到底了</text>
		</view>
	</view>
</template>

<script>
import { getPackageInfo } from '@/api/user.js';
import { mapGetters } from 'vuex';

export default {
	data() {
		return {
			packageTitle: '\u5957\u9910\u4fe1\u606f',
			headerIconClass: 'icon-ic_box',
			pageSize: 10,
			visibleCount: 10,
			loadingMore: false,
			loading: false,
			errorMessage: '',
			responseData: null
		};
	},
	computed: {
		...mapGetters(['userInfo', 'isLogin']),
		currentPhone() {
			return String((this.userInfo && (this.userInfo.phone || this.userInfo.mobile)) || '').trim();
		},
		packageList() {
			return this.fullPackageList.slice(0, this.visibleCount);
		},
		fullPackageList() {
			if (Array.isArray(this.responseData)) {
				return this.responseData;
			}
			if (this.responseData && typeof this.responseData === 'object') {
				return [this.responseData];
			}
			return [];
		},
		hasMore() {
			return this.visibleCount < this.fullPackageList.length;
		}
	},
	watch: {
		currentPhone(newPhone, oldPhone) {
			if (newPhone && newPhone !== oldPhone) {
				this.fetchPackageInfo();
			}
		}
	},
	onLoad() {
		this.fetchPackageInfo();
	},
	onShow() {
		this.fetchPackageInfo();
	},
	onReachBottom() {
		this.loadMore();
	},
	methods: {
		async ensureCurrentPhone() {
			if (this.currentPhone || !this.isLogin) {
				return this.currentPhone;
			}
			try {
				const userInfo = await this.$store.dispatch('USERINFO');
				return String((userInfo && (userInfo.phone || userInfo.mobile)) || '').trim();
			} catch (error) {
				return '';
			}
		},
		async fetchPackageInfo() {
			const phone = await this.ensureCurrentPhone();
			if (!phone) {
				this.responseData = null;
				this.errorMessage = '\u5f53\u524d\u7528\u6237\u672a\u7ed1\u5b9a\u624b\u673a\u53f7';
				return;
			}
			this.loading = true;
			this.visibleCount = this.pageSize;
			this.errorMessage = '';
			try {
				const res = await getPackageInfo(phone);
				this.responseData = res && Object.prototype.hasOwnProperty.call(res, 'data') ? res.data : res;
			} catch (error) {
				this.responseData = null;
				this.errorMessage = typeof error === 'string'
					? error
					: (error && (error.message || error.msg)) || 'Request failed';
			} finally {
				this.loading = false;
			}
		},
		loadMore() {
			if (this.loading || this.loadingMore || !this.hasMore) {
				return;
			}
			this.loadingMore = true;
			setTimeout(() => {
				this.visibleCount = Math.min(this.visibleCount + this.pageSize, this.fullPackageList.length);
				this.loadingMore = false;
			}, 180);
		},
		openPackagePlans(pkg) {
			const saleNo = pkg && (pkg.saleNo || pkg.sale_no || pkg.saleNO);
			const shopId = pkg && (pkg.shopId || pkg.shop_id || pkg.shopID);
			if (!saleNo) {
				uni.showToast({
					title: '未找到saleNo',
					icon: 'none'
				});
				return;
			}
			if (shopId === '' || shopId === null || shopId === undefined) {
				uni.showToast({
					title: '未找到shopId',
					icon: 'none'
				});
				return;
			}
			uni.navigateTo({
				url: `/pages/users/package_plans/index?saleNo=${encodeURIComponent(String(saleNo))}&shopId=${encodeURIComponent(String(shopId))}`
			});
		},
		getPackageFields(data) {
			const fieldMap = [
				{ key: '\u95e8\u5e97\u540d\u79f0', field: 'shopName', icon: 'icon-dianpu2' },
				{ key: '\u8f66\u724c', field: 'cusCarNo', icon: 'icon-gouwuche8' },
				{ key: '\u5957\u9910\u540d\u79f0', field: 'packageName', icon: 'icon-ic_notes' },
				{ key: '\u5957\u9910\u7c7b\u578b', field: 'packType', icon: 'icon-ic_box' },
				{ key: '\u5230\u671f\u65f6\u95f4', field: 'endDate', icon: 'icon-yingyeshijian1' }
			];
			return fieldMap.map(item => ({
				key: item.key,
				icon: item.icon,
				value: this.formatValue(data[item.field])
			}));
		},
		formatIndex(index) {
			const value = index + 1;
			return value < 10 ? `0${value}` : String(value);
		},
		formatValue(value) {
			if (value === null || value === undefined || value === '') {
				return '-';
			}
			if (typeof value === 'object') {
				try {
					return JSON.stringify(value);
				} catch (error) {
					return String(value);
				}
			}
			return String(value);
		}
	}
};
</script>

<style scoped lang="scss">
.package-page {
	position: relative;
	min-height: 100vh;
	padding: 10rpx 12rpx 22rpx;
	background:
		radial-gradient(circle at top center, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0) 30%),
		linear-gradient(180deg, #f3f7ff 0%, #eef3fb 100%);
	box-sizing: border-box;
}

.loading-mask {
	position: fixed;
	inset: 0;
	z-index: 99;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(243, 247, 255, 0.72);
	backdrop-filter: blur(4px);
}

.loading-card {
	width: 180rpx;
	height: 180rpx;
	border-radius: 28rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.96);
	box-shadow: 0 18rpx 40rpx rgba(30, 41, 59, 0.10);
}

.loading-spinner {
	width: 52rpx;
	height: 52rpx;
	border: 5rpx solid #dbeafe;
	border-top-color: #2563eb;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

.loading-text {
	margin-top: 16rpx;
	font-size: 22rpx;
	color: #475569;
}

.error-card,
.empty-card,
.package-card {
	padding: 16rpx 16rpx;
	border-radius: 22rpx;
	background: rgba(255, 255, 255, 0.98);
	border: 1rpx solid rgba(226, 232, 240, 0.9);
	box-shadow: 0 20rpx 50rpx rgba(30, 41, 59, 0.08);
}

.package-card:active {
	transform: scale(0.995);
}

.error-card {
	margin-bottom: 10rpx;
}

.package-card + .package-card {
	margin-top: 12rpx;
}

.card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 10rpx;
	padding-bottom: 10rpx;
	border-bottom: 1rpx solid #edf2f7;
}

.header-left {
	display: flex;
	align-items: center;
	min-width: 0;
}

.header-icon-wrap {
	width: 46rpx;
	height: 46rpx;
	border-radius: 14rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.header-icon {
	font-size: 20rpx;
	line-height: 1;
}

.header-title {
	margin-left: 12rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: #0f172a;
}

.card-index {
	flex-shrink: 0;
	font-size: 28rpx;
	font-weight: 500;
}

.field-list {
	margin-top: 6rpx;
}

.field-row {
	min-height: 64rpx;
	display: flex;
	align-items: center;
	column-gap: 8rpx;
	border-bottom: 1rpx solid #edf2f7;
}

.field-row:last-child {
	border-bottom: 0;
}

.field-left {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	min-width: 0;
}

.field-icon-wrap {
	width: 36rpx;
	height: 36rpx;
	border-radius: 10rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.field-icon {
	font-size: 17rpx;
	line-height: 1;
}

.field-key {
	margin-left: 12rpx;
	font-size: 24rpx;
	font-weight: 600;
	color: #0f172a;
}

.field-value {
	margin-left: auto;
	padding-left: 16rpx;
	max-width: 52%;
	font-size: 24rpx;
	line-height: 1.25;
	color: #374151;
	text-align: right;
	word-break: break-all;
}

.error-title {
	display: block;
	font-size: 24rpx;
	font-weight: 600;
	color: #dc2626;
}

.error-text {
	display: block;
	margin-top: 8rpx;
	font-size: 22rpx;
	line-height: 1.5;
	color: #dc2626;
}

.empty-card {
	text-align: center;
}

.empty-text {
	font-size: 24rpx;
	color: #64748b;
}

.loadmore-box {
	padding: 16rpx 0 2rpx;
	text-align: center;
}

.loadmore-text {
	font-size: 20rpx;
	color: #94a3b8;
}

.theme-blue .header-icon-wrap,
.theme-blue .field-icon-wrap {
	background: linear-gradient(180deg, #eef5ff 0%, #e3eeff 100%);
}

.theme-blue .header-icon,
.theme-blue .field-icon,
.theme-blue .card-index {
	color: #2563eb;
}

.theme-green .header-icon-wrap,
.theme-green .field-icon-wrap {
	background: linear-gradient(180deg, #edfbea 0%, #e1f8dd 100%);
}

.theme-green .header-icon,
.theme-green .field-icon,
.theme-green .card-index {
	color: #31c21f;
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
