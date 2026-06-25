<template>
	<view class="history-page">
		<view v-if="loading" class="loading-mask">
			<view class="loading-card">
				<view class="loading-spinner"></view>
				<text class="loading-text">{{ loadingText }}</text>
			</view>
		</view>

		<view v-if="errorMessage" class="error-card">
			<text class="error-title">{{ errorTitle }}</text>
			<text class="error-text">{{ errorMessage }}</text>
		</view>

		<view v-if="recordList.length" class="record-list">
			<view
				v-for="(record, recordIndex) in recordList"
				:key="recordIndex"
				class="record-card"
				:class="recordIndex % 2 === 0 ? 'theme-orange' : 'theme-blue'"
				@click="handleRecordClick(record)"
			>
				<view class="card-header">
					<view class="header-left">
						<view class="header-icon-wrap">
							<text class="iconfont header-icon" :class="headerIconClass"></text>
						</view>
						<text class="header-title">{{ pageTitle }}</text>
					</view>
					<text class="card-index">{{ getRecordSettlementDate(record) }}</text>
				</view>

				<view class="field-list">
					<view
						v-for="field in getRecordFields(record)"
						:key="`${recordIndex}-${field.key}`"
						class="field-row"
					>
						<text class="field-key">{{ field.key }}</text>
						<text class="field-value">{{ field.value }}</text>
					</view>
				</view>
			</view>
			<view class="loadmore-box">
				<text v-if="loadingMore" class="loadmore-text">加载更多中...</text>
				<text v-else-if="hasMore" class="loadmore-text">上滑加载更多</text>
				<text v-else class="loadmore-text">已显示全部数据</text>
			</view>
		</view>

		<view v-else-if="!loading && !errorMessage" class="empty-card">
			<text class="empty-text">{{ emptyText }}</text>
		</view>
	</view>
</template>

<script>
import { mapGetters } from 'vuex';
import { getSettlementRepairInfo } from '@/api/user.js';

export default {
	data() {
		return {
			pageTitle: '\u6d88\u8d39\u5386\u53f2',
			errorTitle: '\u63d0\u793a',
			emptyText: '\u6682\u65e0\u6570\u636e',
			loadingText: '\u52a0\u8f7d\u4e2d...',
			headerIconClass: 'icon-ic_notes',
			pageSize: 10,
			visibleCount: 10,
			loading: false,
			loadingMore: false,
			errorMessage: '',
			responseData: null,
			hasRequested: false
		};
	},
	computed: {
		...mapGetters(['userInfo', 'isLogin']),
		currentPhone() {
			return String((this.userInfo && (this.userInfo.phone || this.userInfo.mobile)) || '').trim();
		},
		fullRecordList() {
			if (Array.isArray(this.responseData)) {
				return this.responseData;
			}
			if (this.responseData && typeof this.responseData === 'object') {
				return [this.responseData];
			}
			return [];
		},
		recordList() {
			return this.fullRecordList.slice(0, this.visibleCount);
		},
		hasMore() {
			return this.visibleCount < this.fullRecordList.length;
		}
	},
	watch: {
		currentPhone(newPhone, oldPhone) {
			if (!this.hasRequested && newPhone && newPhone !== oldPhone) {
				this.fetchSettlementRepairInfo();
			}
		}
	},
	onLoad() {
		this.fetchSettlementRepairInfo();
	},
	onReachBottom() {
		this.loadMore();
	},
	methods: {
		async ensureCurrentPhone() {
			return this.currentPhone;
		},
		async fetchSettlementRepairInfo() {
			if (this.loading) {
				return;
			}
			const phone = await this.ensureCurrentPhone();
			if (!phone) {
				this.responseData = null;
				this.errorMessage = '\u5f53\u524d\u7528\u6237\u672a\u7ed1\u5b9a\u624b\u673a\u53f7';
				return;
			}
			this.loading = true;
			this.hasRequested = true;
			this.visibleCount = this.pageSize;
			this.errorMessage = '';
			try {
				const res = await getSettlementRepairInfo(phone);
				this.responseData = res && Object.prototype.hasOwnProperty.call(res, 'data') ? res.data : res;
			} catch (error) {
				this.responseData = null;
				this.errorMessage = typeof error === 'string'
					? error
					: (error && (error.message || error.msg)) || '\u8bf7\u6c42\u5931\u8d25';
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
				this.visibleCount = Math.min(this.visibleCount + this.pageSize, this.fullRecordList.length);
				this.loadingMore = false;
			}, 120);
		},
		handleRecordClick(record) {
			const jobNo = this.getRecordParam(record, ['jobNo', 'jobno', 'JobNo', 'saleNo', 'saleNO']);
			const shopId = this.getRecordParam(record, ['shopId', 'shopID', 'shopid', 'ShopId']);
			if (!jobNo || !shopId) {
				uni.showToast({
					title: '当前记录缺少 jobNo 或 shopId',
					icon: 'none'
				});
				return;
			}
			uni.navigateTo({
				url: `/pages/store/settlement_repair_detail/index?jobNo=${encodeURIComponent(jobNo)}&shopId=${encodeURIComponent(shopId)}`
			});
		},
		getRecordParam(record, keys) {
			if (!record || typeof record !== 'object') {
				return '';
			}
			for (let i = 0; i < keys.length; i += 1) {
				const key = keys[i];
				if (Object.prototype.hasOwnProperty.call(record, key)) {
					const value = record[key];
					if (value !== '' && value !== null && value !== undefined) {
						return String(value).trim();
					}
				}
			}
			return '';
		},
		getRecordFields(record) {
			if (!record || typeof record !== 'object') {
				return [];
			}
			const fieldMap = [
				{ key: '\u95e8\u5e97\u540d\u79f0', field: 'shopName' },
				{ key: '\u8f66\u724c', field: 'cusCarNo' },
				{ key: '\u8f66\u8f86\u54c1\u724c', field: 'cusCarOem' },
				{ key: '\u516c\u91cc\u6570', field: 'repKm' },
				{ key: '\u5e94\u6536\u91d1\u989d', field: 'ysrepairMoney' },
				{ key: '\u8fdb\u5e97\u65e5\u671f', field: 'inRepDate' }
			];
			return fieldMap.map((item) => ({
				key: item.key,
				value: this.formatValue(record[item.field])
			}));
		},
		formatValue(value) {
			if (value === null || value === undefined || value === '') {
				return '-';
			}
			if (Array.isArray(value) || typeof value === 'object') {
				try {
					return JSON.stringify(value);
				} catch (error) {
					return String(value);
				}
			}
			return String(value);
		},
		getRecordSettlementDate(record) {
			if (!record || typeof record !== 'object') {
				return '-';
			}
			const rawValue = this.getRecordParam(record, ['finCheckDate', 'fincheckdate', 'checkDate', 'settlementDate']);
			if (!rawValue) {
				return '-';
			}
			return this.formatSettlementDate(rawValue);
		},
		formatSettlementDate(value) {
			const text = String(value).trim();
			if (!text) {
				return '-';
			}
			return text.replace('T', ' ');
		}
	}
};
</script>

<style scoped lang="scss">
.history-page {
	position: relative;
	min-height: 100vh;
	padding: 10rpx 12rpx 22rpx;
	background:
		radial-gradient(circle at top center, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0) 30%),
		linear-gradient(180deg, #fff7ed 0%, #f5f7fb 100%);
	box-sizing: border-box;
}

.loading-mask {
	position: fixed;
	inset: 0;
	z-index: 99;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(245, 247, 251, 0.72);
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
	border: 5rpx solid #fed7aa;
	border-top-color: #f97316;
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
.record-card {
	padding: 16rpx 16rpx;
	border-radius: 22rpx;
	background: rgba(255, 255, 255, 0.98);
	border: 1rpx solid rgba(226, 232, 240, 0.9);
	box-shadow: 0 20rpx 50rpx rgba(30, 41, 59, 0.08);
}

.error-card {
	margin-bottom: 10rpx;
}

.record-card + .record-card {
	margin-top: 12rpx;
}

.record-card {
	cursor: pointer;
}

.record-card:active {
	transform: scale(0.995);
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

.field-key {
	flex-shrink: 0;
	max-width: 18%;
	font-size: 24rpx;
	font-weight: 600;
	color: #0f172a;
	word-break: break-all;
}

.field-value {
	margin-left: auto;
	max-width: 82%;
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
	padding: 10rpx 0 4rpx;
	text-align: center;
}

.loadmore-text {
	font-size: 20rpx;
	color: #94a3b8;
}

.theme-orange .header-icon-wrap,
.theme-orange .card-index {
	background: linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%);
	color: #f97316;
}

.theme-orange .header-icon {
	color: #f97316;
}

.theme-blue .header-icon-wrap,
.theme-blue .card-index {
	background: linear-gradient(180deg, #eef5ff 0%, #e3eeff 100%);
	color: #2563eb;
}

.theme-blue .header-icon {
	color: #2563eb;
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
