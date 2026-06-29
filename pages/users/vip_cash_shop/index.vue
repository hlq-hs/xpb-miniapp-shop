<template>
	<view class="shop-balance-page">
		<view v-if="loading" class="loading-mask">
			<view class="loading-card">
				<view class="loading-spinner"></view>
				<text class="loading-text">加载中...</text>
			</view>
		</view>

		<view v-if="errorMessage" class="error-card">
			<text class="error-title">提示</text>
			<text class="error-text">{{ errorMessage }}</text>
		</view>

		<view v-if="visibleShopGroups.length" class="summary-card">
			<view class="summary-main">
				<text class="summary-label">门店总余额(元)</text>
				<text class="summary-value">{{ totalBalanceText }}</text>
			</view>
		</view>

		<view v-if="visibleShopGroups.length" class="shop-list">
			<view
				v-for="(group, groupIndex) in visibleShopGroups"
				:key="group.key"
				class="shop-card"
				:class="groupIndex % 2 === 0 ? 'theme-red' : 'theme-blue'"
			>
				<view class="card-header">
					<view class="header-left">
						<view class="header-icon-wrap">
							<text class="iconfont header-icon icon-dianpu2"></text>
						</view>
						<view class="header-text">
							<text class="header-title">{{ group.shopName }}</text>
						</view>
					</view>
					<text class="shop-balance-value">{{ group.balanceText }}</text>
				</view>

				<view class="detail-list">
					<view
						v-for="(item, itemIndex) in group.items"
						:key="group.key + '-' + itemIndex"
						class="detail-item"
						:data-group-index="groupIndex"
						:data-item-index="itemIndex"
						@tap="openCashDetail"
					>
						<view class="detail-top">
							<text class="detail-title">{{ getDetailTitle(item, itemIndex) }}</text>
							<text class="detail-balance">{{ getShopBalance(item) }}</text>
						</view>
						<view class="detail-fields">
							<view
								v-for="field in getDetailFields(item)"
								:key="group.key + '-' + itemIndex + '-' + field.key"
								class="detail-field"
							>
								<text class="detail-key">{{ field.key }}</text>
								<text class="detail-value">{{ field.value }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view v-else-if="!loading && !errorMessage" class="empty-card">
			<text class="empty-text">暂无门店余额</text>
		</view>

		<view v-if="shopGroups.length" class="loadmore-box">
			<text v-if="loadingMore" class="loadmore-text">加载更多中...</text>
			<text v-else-if="hasMore" class="loadmore-text">上滑加载更多</text>
			<text v-else class="loadmore-text">已显示全部数据</text>
		</view>
		<view v-if="detailVisible" class="detail-modal-mask" @tap="closeCashDetail">
			<view class="detail-modal" @tap.stop>
				<view class="detail-modal-header">
					<view class="detail-modal-title-wrap">
						<text class="detail-modal-title">余额明细</text>
						<text class="detail-modal-subtitle">{{ activeDetailTitle }}</text>
					</view>
					<text class="detail-modal-close" @tap="closeCashDetail">x</text>
				</view>
				<view v-if="detailLoading" class="detail-modal-state">加载中...</view>
				<view v-else-if="detailErrorMessage" class="detail-modal-state error">{{ detailErrorMessage }}</view>
				<scroll-view v-else scroll-y class="detail-modal-content">
					<view v-if="cashDetailList.length">
						<view
							v-for="(detail, index) in cashDetailList"
							:key="index"
							class="cash-detail-row"
						>
							<view
								v-for="field in getCashDetailFields(detail)"
								:key="index + '-' + field.key"
								class="cash-detail-field"
							>
								<text class="cash-detail-key">{{ field.key }}</text>
								<text class="cash-detail-value">{{ field.value }}</text>
							</view>
						</view>
					</view>
					<view v-else class="detail-modal-state">暂无明细</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
import { mapGetters } from 'vuex';
import { getVipCashAmountByShop, getVipCashInfoList } from '@/api/user.js';

const BALANCE_FIELDS = [
	'amount',
	'cashAmount',
	'cash',
	'vipCashAmount',
	'vipCash',
	'balance',
	'storeBalance',
	'shopBalance',
	'shopCashAmount',
	'nowMoney',
	'money'
];
const SHOP_NAME_FIELDS = ['shopName', 'shop_name', 'storeName', 'store_name', 'name'];
const SHOP_ID_FIELDS = ['shopId', 'shopID', 'shopid', 'ShopId', 'SHOPID', 'shop_id', 'storeId', 'store_id'];

export default {
	data() {
		return {
			phone: '',
			pageSize: 10,
			visibleCount: 10,
			loading: false,
			loadingMore: false,
			errorMessage: '',
			responseData: null,
			detailVisible: false,
			detailLoading: false,
			detailErrorMessage: '',
			activeDetailTitle: '',
			cashDetailData: null
		};
	},
	computed: {
		...mapGetters(['userInfo']),
		currentPhone() {
			return String(this.phone || (this.userInfo && (this.userInfo.phone || this.userInfo.mobile)) || '').trim();
		},
		fullShopList() {
			return this.extractList(this.responseData);
		},
		shopGroups() {
			const groups = [];
			const groupMap = {};
			const defaultShopId = this.getShopId(this.responseData) || '9000';
			this.fullShopList.forEach((item, index) => {
				const shopName = this.getShopName(item, index);
				const shopId = this.getShopId(item) || defaultShopId;
				const groupKey = shopId || shopName ? `${shopId || ''}-${shopName || ''}` : `shop-${index}`;
				if (!groupMap[groupKey]) {
					groupMap[groupKey] = {
						key: groupKey,
						shopName,
						shopId,
						items: [],
						balance: 0
					};
					groups.push(groupMap[groupKey]);
				}
				groupMap[groupKey].items.push(Object.assign({}, item, { shopId }));
			});
			return groups.map(group => {
				const firstItem = group.items[0] || {};
				const balance = this.getGroupBalance(group.items);
				return {
					...group,
					balance,
					balanceText: this.formatMoney(balance)
				};
			});
		},
		visibleShopGroups() {
			return this.shopGroups.slice(0, this.visibleCount);
		},
		hasMore() {
			return this.visibleCount < this.shopGroups.length;
		},
		totalBalanceText() {
			const total = this.shopGroups.reduce((sum, group) => sum + group.balance, 0);
			return this.formatMoney(total);
		},
		cashDetailList() {
			return this.extractList(this.cashDetailData);
		}
	},
	watch: {
		currentPhone(newPhone, oldPhone) {
			if (newPhone && newPhone !== oldPhone && !this.responseData) {
				this.fetchShopBalanceList();
			}
		}
	},
	onLoad(options) {
		this.phone = String((options && options.phone) || '').trim();
		this.loadCachedData();
		if (!this.responseData) {
			this.fetchShopBalanceList();
		}
	},
	onReachBottom() {
		this.loadMore();
	},
	methods: {
		loadCachedData() {
			try {
				const cached = uni.getStorageSync('vipCashAmountByShopData');
				if (cached) {
					this.responseData = cached;
					uni.removeStorageSync('vipCashAmountByShopData');
				}
			} catch (error) {
				this.responseData = null;
			}
		},
		async fetchShopBalanceList() {
			const phone = this.currentPhone;
			if (!phone) {
				this.responseData = null;
				this.errorMessage = '当前用户未绑定手机号';
				return;
			}
			this.loading = true;
			this.visibleCount = this.pageSize;
			this.errorMessage = '';
			try {
				const res = await getVipCashAmountByShop(phone);
				this.responseData = res && Object.prototype.hasOwnProperty.call(res, 'data') ? res.data : res;
			} catch (error) {
				this.responseData = null;
				this.errorMessage = typeof error === 'string'
					? error
					: (error && (error.message || error.msg)) || '请求失败';
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
				this.visibleCount = Math.min(this.visibleCount + this.pageSize, this.shopGroups.length);
				this.loadingMore = false;
			}, 120);
		},
		async openCashDetail(event) {
			const dataset = (event && event.currentTarget && event.currentTarget.dataset) || {};
			const groupIndex = Number(dataset.groupIndex);
			const itemIndex = Number(dataset.itemIndex);
			const group = this.visibleShopGroups[groupIndex] || {};
			const item = (group.items && group.items[itemIndex]) || {};
			const cusNo = this.getCustomerKey(item);
			const shopId = this.getShopId(item);
			if (!cusNo || !shopId) {
				uni.showToast({
					title: '缺少客户编号或门店ID',
					icon: 'none'
				});
				return;
			}
			this.detailVisible = true;
			this.detailLoading = true;
			this.detailErrorMessage = '';
			this.cashDetailData = null;
			this.activeDetailTitle = this.getDetailTitle(item, 0);
			try {
				const res = await getVipCashInfoList(cusNo, shopId);
				this.cashDetailData = res && Object.prototype.hasOwnProperty.call(res, 'data') ? res.data : res;
			} catch (error) {
				this.detailErrorMessage = typeof error === 'string'
					? error
					: (error && (error.message || error.msg)) || '请求失败';
			} finally {
				this.detailLoading = false;
			}
		},
		closeCashDetail() {
			this.detailVisible = false;
		},
		extractList(data) {
			if (Array.isArray(data)) {
				return data;
			}
			if (!data || typeof data !== 'object') {
				return [];
			}
			const listKeys = ['list', 'records', 'rows', 'items', 'data'];
			for (let i = 0; i < listKeys.length; i += 1) {
				const value = data[listKeys[i]];
				if (Array.isArray(value)) {
					return value;
				}
			}
			return [data];
		},
		getShopName(shop, index) {
			const value = this.getFirstValue(shop, SHOP_NAME_FIELDS);
			return value || `门店${index + 1}`;
		},
		getShopBalance(shop) {
			return this.formatMoney(this.getNumericBalance(shop));
		},
		getNumericBalance(shop) {
			const value = this.getFirstValue(shop, BALANCE_FIELDS);
			const num = Number(value);
			return Number.isNaN(num) ? 0 : num;
		},
		getGroupBalance(items) {
			const customerBalanceMap = {};
			let hasCustomerKey = false;
			items.forEach((item, index) => {
				const customerKey = this.getCustomerKey(item);
				if (customerKey) {
					hasCustomerKey = true;
					customerBalanceMap[customerKey] = this.getNumericBalance(item);
				} else if (!hasCustomerKey) {
					customerBalanceMap[`row-${index}`] = this.getNumericBalance(item);
				}
			});
			return Object.keys(customerBalanceMap).reduce((sum, key) => sum + customerBalanceMap[key], 0);
		},
		getCustomerKey(item) {
			return this.getFirstValue(item, ['cusNo', 'customerNo', 'customerCode', 'customerId', 'cusId']);
		},
		getShopId(item) {
			return this.getFirstValue(item, SHOP_ID_FIELDS);
		},
		getDetailTitle(item, index) {
			return this.getFirstValue(item, ['cusCarNo', 'carNo', 'plateNo', 'carNumber']) || `明细${index + 1}`;
		},
		getDetailFields(item) {
			const fieldMap = [
				{ key: '车牌号', fields: ['cusCarNo', 'carNo', 'plateNo', 'carNumber'] },
				{ key: '客户编号', fields: ['cusNo', 'customerNo', 'customerCode'] }
			];
			const usedFields = SHOP_NAME_FIELDS
				.concat(SHOP_ID_FIELDS)
				.concat(BALANCE_FIELDS)
				.concat(['address', 'shopAddress', 'storeAddress', 'shopPhone', 'tel', 'phone', 'mobile', 'updateTime', 'updatedAt', 'createTime', 'createdAt'])
				.concat(fieldMap.reduce((fields, itemField) => fields.concat(itemField.fields), []));
			const knownFields = fieldMap
				.map(itemField => ({
					key: itemField.key,
					value: this.formatValue(this.getFirstValue(item, itemField.fields))
				}))
				.filter(field => field.value !== '-');
			return knownFields.concat(this.getExtraFields(item, usedFields));
		},
		getCashDetailFields(detail) {
			if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
				return [
					{
						key: '明细',
						value: this.formatValue(detail)
					}
				];
			}
			const cashAmount = Number(this.getFirstValue(detail, ['cashAmount']));
			const cashType = !Number.isNaN(cashAmount) && cashAmount < 0 ? '消费' : '充值';
			const fieldMap = [
				{ key: '充值项目', fields: ['cashName'] },
				{ key: '时间', fields: ['cashDate'] },
				{ key: '金额', fields: ['cashAmount'] },
				{ key: '类型', value: cashType },
				{ key: '业务类型', fields: ['busType'] }
			];
			return fieldMap
				.map(item => ({
					key: item.key,
					value: item.value || this.formatValue(this.getFirstValue(detail, item.fields))
				}))
				.filter(item => item.value !== '-');
		},
		getExtraFields(shop, usedFields) {
			if (!shop || typeof shop !== 'object' || Array.isArray(shop)) {
				return [];
			}
			return Object.keys(shop)
				.filter(key => usedFields.indexOf(key) === -1)
				.map(key => ({
					key,
					value: this.formatValue(shop[key])
				}))
				.filter(item => item.value !== '-');
		},
		getFirstValue(data, fields) {
			if (!data || typeof data !== 'object') {
				return '';
			}
			for (let i = 0; i < fields.length; i += 1) {
				const key = fields[i];
				if (Object.prototype.hasOwnProperty.call(data, key)) {
					const value = data[key];
					if (value !== null && value !== undefined && value !== '') {
						return value;
					}
				}
			}
			return '';
		},
		formatIndex(index) {
			const value = index + 1;
			return value < 10 ? `0${value}` : String(value);
		},
		formatMoney(value) {
			const num = Number(value);
			if (Number.isNaN(num)) {
				return '0.00';
			}
			return num.toFixed(2);
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
		}
	}
};
</script>

<style scoped lang="scss">
.shop-balance-page {
	position: relative;
	min-height: 100vh;
	padding: 18rpx 18rpx 32rpx;
	background: linear-gradient(180deg, #fff5f4 0%, #f6f7fb 46%, #eef3ff 100%);
	box-sizing: border-box;
}

.loading-mask {
	position: fixed;
	inset: 0;
	z-index: 99;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(246, 247, 251, 0.72);
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
	border: 5rpx solid #fee2e2;
	border-top-color: #ef4444;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

.loading-text {
	margin-top: 16rpx;
	font-size: 22rpx;
	color: #475569;
}

.summary-card,
.error-card,
.empty-card,
.shop-card {
	padding: 24rpx 24rpx;
	border-radius: 24rpx;
	background: rgba(255, 255, 255, 0.98);
	border: 1rpx solid rgba(226, 232, 240, 0.9);
	box-shadow: 0 20rpx 50rpx rgba(30, 41, 59, 0.08);
}

.summary-card {
	margin-bottom: 18rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: linear-gradient(135deg, #ff4b3e 0%, #f33c2b 100%);
	color: #fff;
}

.summary-main {
	display: flex;
	flex-direction: column;
}

.summary-label {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.78);
}

.summary-value {
	margin-top: 12rpx;
	font-size: 56rpx;
	font-weight: 700;
	line-height: 1;
}

.shop-card + .shop-card {
	margin-top: 18rpx;
}

.error-card {
	margin-bottom: 18rpx;
}

.card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 12rpx;
	padding-bottom: 18rpx;
	border-bottom: 1rpx solid #edf2f7;
}

.header-left {
	display: flex;
	align-items: center;
	min-width: 0;
}

.header-icon-wrap {
	width: 56rpx;
	height: 56rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.header-icon {
	font-size: 28rpx;
	line-height: 1;
}

.header-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #0f172a;
	word-break: break-all;
}

.shop-balance-value {
	flex-shrink: 0;
	margin-left: 18rpx;
	font-size: 36rpx;
	font-weight: 700;
	line-height: 1;
	color: #ef4444;
}

.header-text {
	margin-left: 14rpx;
	min-width: 0;
	display: flex;
	flex-direction: column;
}

.field-list {
	margin-top: 10rpx;
}

.field-list.compact {
	padding: 8rpx 0;
}

.field-row {
	min-height: 52rpx;
	display: flex;
	align-items: center;
	column-gap: 10rpx;
	border-bottom: 1rpx solid #edf2f7;
}

.field-row:last-child {
	border-bottom: 0;
}

.field-key {
	flex-shrink: 0;
	font-size: 24rpx;
	font-weight: 600;
	color: #334155;
}

.field-value {
	margin-left: auto;
	max-width: 70%;
	font-size: 24rpx;
	line-height: 1.35;
	color: #475569;
	text-align: right;
	word-break: break-all;
}

.detail-list {
	margin-top: 12rpx;
}

.detail-item {
	padding: 18rpx 0;
	border-top: 1rpx solid #edf2f7;
}

.detail-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 14rpx;
}

.detail-title {
	font-size: 26rpx;
	font-weight: 700;
	color: #1f2937;
	word-break: break-all;
}

.detail-balance {
	flex-shrink: 0;
	font-size: 30rpx;
	font-weight: 700;
	color: #ef4444;
}

.detail-fields {
	margin-top: 10rpx;
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx;
}

.detail-field {
	max-width: 100%;
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	background: #f8fafc;
}

.detail-key {
	font-size: 21rpx;
	color: #94a3b8;
}

.detail-value {
	margin-left: 8rpx;
	font-size: 21rpx;
	color: #475569;
	word-break: break-all;
}

.error-title {
	display: block;
	font-size: 26rpx;
	font-weight: 600;
	color: #dc2626;
}

.error-text,
.empty-text {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	line-height: 1.5;
	color: #64748b;
	text-align: center;
}

.loadmore-box {
	padding: 18rpx 0 4rpx;
	text-align: center;
}

.loadmore-text {
	font-size: 22rpx;
	color: #94a3b8;
}

.theme-red .header-icon-wrap {
	background: #fff1f2;
}

.theme-red .header-icon {
	color: #ef4444;
}

.theme-blue .header-icon-wrap {
	background: #eef5ff;
}

.theme-blue .header-icon {
	color: #2563eb;
}

.detail-modal-mask {
	position: fixed;
	inset: 0;
	z-index: 120;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	background: rgba(15, 23, 42, 0.45);
}

.detail-modal {
	width: 100%;
	max-height: 76vh;
	padding: 28rpx 28rpx 34rpx;
	border-radius: 28rpx 28rpx 0 0;
	background: #fff;
	box-sizing: border-box;
}

.detail-modal-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	column-gap: 20rpx;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #edf2f7;
}

.detail-modal-title-wrap {
	min-width: 0;
	display: flex;
	flex-direction: column;
}

.detail-modal-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #0f172a;
}

.detail-modal-subtitle {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #64748b;
	word-break: break-all;
}

.detail-modal-close {
	width: 52rpx;
	height: 52rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	font-size: 34rpx;
	line-height: 1;
	color: #64748b;
	background: #f1f5f9;
}

.detail-modal-content {
	max-height: 58vh;
}

.detail-modal-state {
	padding: 56rpx 0;
	font-size: 26rpx;
	color: #64748b;
	text-align: center;
}

.detail-modal-state.error {
	color: #dc2626;
}

.cash-detail-row {
	padding: 22rpx 0;
	border-bottom: 1rpx solid #edf2f7;
}

.cash-detail-row:last-child {
	border-bottom: 0;
}

.cash-detail-field {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	column-gap: 20rpx;
	padding: 8rpx 0;
}

.cash-detail-key {
	flex-shrink: 0;
	max-width: 42%;
	font-size: 24rpx;
	color: #64748b;
	word-break: break-all;
}

.cash-detail-value {
	font-size: 24rpx;
	color: #0f172a;
	text-align: right;
	word-break: break-all;
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
