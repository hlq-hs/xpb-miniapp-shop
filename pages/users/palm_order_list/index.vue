<template>
	<view class="palm-order-page">
		<view class="tabs-row">
			<view
				v-for="tab in tabs"
				:key="tab.value"
				class="tab-item"
				:class="{ active: activeTab === tab.value }"
				@click="handleTabChange(tab.value)"
			>
				{{ tab.label }}
			</view>
		</view>

		<view class="filter-row">
			<view class="filter-search-box">
				<view class="filter-search-icon"></view>
				<input
					v-model="searchKeyword"
					class="filter-input"
					type="text"
					placeholder="请输入服务门店 / 车牌"
					placeholder-class="filter-placeholder"
					confirm-type="search"
				/>
			</view>
			<picker v-if="activeTab === '2'" mode="date" :value="filterDate" @change="handleDateChange">
				<view class="filter-date-box">
					<view class="filter-date-icon"></view>
					<text class="filter-date-text">{{ filterDate || '请选择时间' }}</text>
					<view v-if="filterDate" class="filter-date-clear" @tap.stop="clearFilterDate">×</view>
					<view class="filter-date-arrow"></view>
				</view>
			</picker>
		</view>

		<view v-if="loading" class="loading-box">加载中...</view>

		<scroll-view v-else scroll-y class="content-scroll" refresher-enabled :refresher-triggered="refreshing" @refresherrefresh="handleRefresh">
			<view v-if="!filteredOrderList.length" class="empty-card">暂无手掌订单</view>

			<view v-for="(order, index) in filteredOrderList" :key="getOrderKey(order, index)" class="order-card" :data-index="index" @click="goPalmOrderDetail">
				<view class="card-head">
					<view class="plate-main">
						<view class="plate-icon">车</view>
						<text class="plate-title">{{ getPlateText(order, index) }}</text>
					</view>
					<text v-if="getStatusText(order)" class="status-pill">{{ getStatusText(order) }}</text>
				</view>

				<view class="field-list">
					<view v-for="field in getOrderInfoRows(order)" :key="field.key" class="field-row">
						<view class="field-icon">{{ field.icon }}</view>
						<text class="field-key">{{ field.key }}:</text>
						<text class="field-value" :class="{ phone: field.type === 'phone' }">{{ field.value }}</text>
					</view>
				</view>

				<view class="card-footer">
					<view class="amount-text">实收: <text>{{ formatAmountText(getOrderAmount(order)) }}</text></view>
					<view v-if="isPendingSettlement(order)" class="pay-button" :data-index="index" @click.stop="openPayTypePanel">支付</view>
				</view>
			</view>
		</scroll-view>

		<view v-if="payPanelVisible" class="pay-mask" @click="closePayTypePanel"></view>
		<view class="pay-panel" :class="{ show: payPanelVisible }">
			<view class="pay-panel-title">选择支付方式</view>
			<view class="pay-panel-option" data-pay-type="balance" @click="confirmPalmPay">
				<view class="pay-option-icon balance-icon">￥</view>
				<view class="pay-option-main">
					<view class="pay-option-name">余额支付</view>
					<view class="pay-option-desc">使用账户余额结算</view>
				</view>
				<view class="pay-option-arrow">›</view>
			</view>
			<view class="pay-panel-option" data-pay-type="sqb" @click="confirmPalmPay">
				<view class="pay-option-icon wx-icon">微</view>
				<view class="pay-option-main">
					<view class="pay-option-name">微信支付</view>
					<view class="pay-option-desc">拉起微信收银台支付</view>
				</view>
				<view class="pay-option-arrow">›</view>
			</view>
			<view class="pay-panel-cancel" @click="closePayTypePanel">取消</view>
		</view>
	</view>
</template>

<script>
import { mapGetters } from 'vuex';
import { getPalmOrderList, sqbPrecreate } from '@/api/user.js';

export default {
	data() {
		return {
			activeTab: '1',
			loading: false,
			refreshing: false,
			payingOrderKey: '',
			payPanelVisible: false,
			pendingPayOrder: null,
			pendingPayIndex: -1,
			needRefreshOnShow: false,
			searchKeyword: '',
			filterDate: '',
			orderList: [],
			tabs: [
				{ label: '待支付', value: '1', status: 1 },
				{ label: '已支付', value: '2', status: 2 }
			]
		};
	},
	computed: {
		...mapGetters(['userInfo', 'isLogin', 'uid']),
		currentPhone() {
			return String((this.userInfo && (this.userInfo.phone || this.userInfo.mobile)) || '').trim();
		},
		filteredOrderList() {
			const keyword = String(this.searchKeyword || '').trim().toLowerCase();
			const date = String(this.filterDate || '').trim();
			return this.orderList.filter(order => {
				if (keyword) {
					const text = [
						order.tenantName,
						order.carNumber,
						order.plateNo,
						order.vehicleNo,
						order.workOrderNo,
						order.orderNo
					].map(item => String(item || '').toLowerCase()).join(' ');
					if (text.indexOf(keyword) === -1) return false;
				}
				if (this.activeTab === '2' && date) {
					const createDate = this.formatTime(order.createTime).slice(0, 10);
					if (createDate !== date) return false;
				}
				return true;
			});
		}
	},
	onLoad(options) {
		if (options && options.status !== undefined && options.status !== '') {
			this.activeTab = String(options.status);
		}
		this.fetchPalmOrderList();
	},
	onShow() {
		if (!this.orderList.length) return;
		if (!this.needRefreshOnShow) {
			this.fetchPalmOrderList();
			return;
		}
		this.needRefreshOnShow = false;
		this.fetchPalmOrderList();
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
		getCurrentStatus() {
			const tab = this.tabs.find(item => item.value === this.activeTab);
			return tab ? tab.status : '';
		},
		extractList(data) {
			if (Array.isArray(data)) return data;
			if (Array.isArray(data && data.data)) return data.data;
			if (Array.isArray(data && data.list)) return data.list;
			if (Array.isArray(data && data.rows)) return data.rows;
			if (Array.isArray(data && data.items)) return data.items;
			if (Array.isArray(data && data.records)) return data.records;
			if (data && typeof data === 'object') return [data];
			return [];
		},
		async fetchPalmOrderList() {
			const phone = await this.ensureCurrentPhone();
			if (!phone) {
				this.orderList = [];
				uni.showToast({
					title: '当前用户未绑定手机号',
					icon: 'none'
				});
				return;
			}
			this.loading = !this.refreshing;
			try {
				const res = await getPalmOrderList(phone, this.getCurrentStatus());
				const list = this.extractList(res && Object.prototype.hasOwnProperty.call(res, 'data') ? res.data : res);
				uni.setStorageSync('latestPalmOrderListResult', res);
				uni.setStorageSync('latestPalmOrderList', list);
				this.orderList = list;
			} catch (error) {
				this.orderList = [];
				uni.showToast({
					title: typeof error === 'string' ? error : '手掌订单加载失败',
					icon: 'none'
				});
			} finally {
				this.loading = false;
				this.refreshing = false;
			}
		},
		handleRefresh() {
			this.refreshing = true;
			this.fetchPalmOrderList();
		},
		handleTabChange(value) {
			if (this.activeTab === value) return;
			this.activeTab = value;
			if (this.activeTab !== '2') {
				this.filterDate = '';
			}
			this.fetchPalmOrderList();
		},
		handleDateChange(event) {
			this.filterDate = event && event.detail ? event.detail.value : '';
		},
		clearFilterDate() {
			this.filterDate = '';
		},
		getOrderKey(order, index) {
			return order.id || order.orderId || order.orderNo || order.palmOrderNo || index;
		},
		getWorkOrderId(order) {
			order = order || {};
			return String(order.id || '').trim();
		},
		goPalmOrderDetail(event) {
			const index = event && event.currentTarget && event.currentTarget.dataset
				? Number(event.currentTarget.dataset.index)
				: -1;
			const order = Number.isInteger(index) && this.filteredOrderList[index] ? this.filteredOrderList[index] : {};
			const workOrderId = this.getWorkOrderId(order);
			if (!workOrderId) {
				uni.showToast({
					title: '缺少工单ID',
					icon: 'none'
				});
				return;
			}
			const status = order.status === undefined ? order.orderStatus : order.status;
			const amount = this.getOrderAmount(order);
			uni.setStorageSync(`palmOrderSnapshot_${workOrderId}`, order);
			const query = [
				`workOrderId=${encodeURIComponent(workOrderId)}`,
				`status=${encodeURIComponent(status === undefined || status === null ? '' : status)}`,
				`amount=${encodeURIComponent(amount === undefined || amount === null ? '' : amount)}`
			].join('&');
			uni.navigateTo({
				url: `/pages/users/palm_order_detail/index?${query}`
			});
		},
		getStatusText(order) {
			const status = order.status === undefined ? order.orderStatus : order.status;
			const sourceText = String(order.statusName || order.statusText || '').trim();
			if (sourceText === '完工') return '待支付';
			const statusMap = {
				1: '待支付',
				2: '已支付'
			};
			return statusMap[Number(status)] || sourceText || '';
		},
		isPendingSettlement(order) {
			const status = order.status === undefined ? order.orderStatus : order.status;
			const sourceText = String((order && (order.statusName || order.statusText)) || '').trim();
			return Number(status) === 1 || sourceText === '完工';
		},
		getCurrentOpenId() {
			const storeUserInfo = this.userInfo || {};
			let cachedUserInfo = uni.getStorageSync('USER_INFO') || {};
			if (typeof cachedUserInfo === 'string') {
				try {
					cachedUserInfo = JSON.parse(cachedUserInfo);
				} catch (error) {
					cachedUserInfo = {};
				}
			}
			return String(
				storeUserInfo.openId ||
				storeUserInfo.openid ||
				cachedUserInfo.openId ||
				cachedUserInfo.openid ||
				''
			).trim();
		},
		async ensureCurrentOpenId() {
			const currentOpenId = this.getCurrentOpenId();
			if (currentOpenId || !this.isLogin) return currentOpenId;
			try {
				const userInfo = await this.$store.dispatch('USERINFO');
				return String((userInfo && (userInfo.openId || userInfo.openid)) || '').trim();
			} catch (error) {
				return '';
			}
		},
		getOrderNo(order) {
			order = order || {};
			return String(order.workOrderNo || order.orderNo || order.orderId || order.palmOrderNo || order.id || '').trim();
		},
		getOrderAmount(order) {
			order = order || {};
			return order.actualAmount !== undefined && order.actualAmount !== null
				? order.actualAmount
				: (order.amount !== undefined && order.amount !== null ? order.amount : order.totalAmount);
		},
		toCentAmount(value) {
			const amount = Number(String(value === undefined || value === null ? '' : value).replace(/,/g, '').trim());
			if (!Number.isFinite(amount)) return '';
			return String(Math.round(amount * 100));
		},
		buildSqbPrecreatePayload(order, openId, payType) {
			order = order || {};
			return {
				workOrderNo: this.getOrderNo(order),
				total_amount: this.toCentAmount(this.getOrderAmount(order)),
				payer_uid: String(openId || this.getCurrentOpenId()).trim(),
				uid: Number(this.uid || 0) || 0,
				payType: payType
			};
		},
		getQrCodeUrl(result) {
			const data = (result && result.data) || result || {};
			const candidates = [
				data.qr_code,
				data.qrCode,
				data.payUrl,
				data.pay_url,
				data.data && data.data.qr_code,
				data.data && data.data.qrCode,
				data.data && data.data.payUrl,
				data.data && data.data.pay_url
			];
			return String(candidates.find(item => item) || '').trim();
		},
		openQrCodeUrl(url) {
			if (!url) {
				uni.showToast({ title: '未返回支付链接', icon: 'none' });
				return;
			}
			const backUrl = '/pages/users/palm_order_list/index?status=2';
			// #ifdef H5
			window.location.href = url;
			// #endif
			// #ifndef H5
			uni.navigateTo({
				url: `/pages/users/web_page/index?webUel=${encodeURIComponent(url)}&title=${encodeURIComponent('正在支付')}&backUrl=${encodeURIComponent(backUrl)}`
			});
			// #endif
		},
		getPayConfig(result) {
			const data = (result && result.data) || result || {};
			const source = data.wxJsapiPay || data.jsConfig || data.payInfo || data.pay_info || data.payData || data.data || data;
			let payInfo = source;
			if (typeof source === 'string') {
				try {
					payInfo = JSON.parse(source);
				} catch (error) {
					payInfo = {};
				}
			}
			return {
				timeStamp: String(payInfo.timeStamp || payInfo.timestamp || ''),
				nonceStr: String(payInfo.nonceStr || payInfo.nonce_str || ''),
				package: String(payInfo.package || payInfo.packageStr || payInfo.packages || ''),
				signType: String(payInfo.signType || payInfo.sign_type || 'RSA'),
				paySign: String(payInfo.paySign || payInfo.pay_sign || '')
			};
		},
		hasPayConfig(payConfig) {
			return !!(payConfig && payConfig.timeStamp && payConfig.nonceStr && payConfig.package && payConfig.paySign);
		},
		requestWxPayment(payConfig) {
			return new Promise((resolve, reject) => {
				uni.requestPayment({
					timeStamp: payConfig.timeStamp,
					nonceStr: payConfig.nonceStr,
					package: payConfig.package,
					signType: payConfig.signType,
					paySign: payConfig.paySign,
					success: resolve,
					fail: reject
				});
			});
		},
		async invokeWxPayment(result) {
			const payConfig = this.getPayConfig(result);
			uni.setStorageSync('latestSqbPayConfig', payConfig);
			if (!this.hasPayConfig(payConfig)) {
				uni.showToast({ title: '未返回支付参数', icon: 'none' });
				return;
			}
			await this.requestWxPayment(payConfig);
			uni.showToast({ title: '支付成功', icon: 'success' });
			await this.fetchPalmOrderList();
		},
		resolvePayOrder(order, index) {
			if (order && !order.currentTarget) return order;
			const eventIndex = order && order.currentTarget && order.currentTarget.dataset
				? order.currentTarget.dataset.index
				: index;
			const listIndex = Number(eventIndex);
			return Number.isInteger(listIndex) && this.filteredOrderList[listIndex] ? this.filteredOrderList[listIndex] : {};
		},
		openPayTypePanel(event) {
			if (this.payingOrderKey) return;
			const index = event && event.currentTarget && event.currentTarget.dataset
				? event.currentTarget.dataset.index
				: -1;
			this.pendingPayOrder = this.resolvePayOrder(event, index);
			this.pendingPayIndex = Number(index);
			if (!this.getOrderNo(this.pendingPayOrder)) {
				uni.showToast({ title: '缺少订单号', icon: 'none' });
				this.pendingPayOrder = null;
				this.pendingPayIndex = -1;
				return;
			}
			this.payPanelVisible = true;
		},
		closePayTypePanel() {
			if (this.payingOrderKey) return;
			this.payPanelVisible = false;
			this.pendingPayOrder = null;
			this.pendingPayIndex = -1;
		},
		confirmPalmPay(event) {
			const payType = event && event.currentTarget && event.currentTarget.dataset
				? event.currentTarget.dataset.payType
				: 'sqb';
			const currentOrder = this.pendingPayOrder || this.resolvePayOrder(null, this.pendingPayIndex);
			if (payType === 'balance') {
				uni.showModal({
					title: '余额支付',
					content: '是否确定余额支付？',
					confirmText: '是',
					cancelText: '否',
					success: (res) => {
						this.payPanelVisible = false;
						if (res.confirm) {
							this.handleSqbPay(currentOrder, this.pendingPayIndex, payType);
						}
					}
				});
				return;
			}
			this.payPanelVisible = false;
			this.handleSqbPay(currentOrder, this.pendingPayIndex, payType);
		},
		async handleSqbPay(order, index, payType) {
			if (this.payingOrderKey) return;
			payType = payType === 'balance' ? 'balance' : 'sqb';
			const currentOrder = this.resolvePayOrder(order, index);
			const openId = await this.ensureCurrentOpenId();
			const payload = this.buildSqbPrecreatePayload(currentOrder, openId, payType);
			if (!payload.workOrderNo) {
				uni.showToast({ title: '缺少订单号', icon: 'none' });
				return;
			}
			if (!payload.total_amount) {
				uni.showToast({ title: '缺少支付金额', icon: 'none' });
				return;
			}
			if (!payload.payer_uid) {
				uni.showToast({ title: '未获取到openid', icon: 'none' });
				return;
			}
			this.payingOrderKey = payload.workOrderNo;
			uni.setStorageSync('latestSqbPrecreateRequestBody', payload);
			uni.showLoading({
				title: '正在支付',
				mask: true
			});
			try {
				const result = await sqbPrecreate(payload);
				uni.setStorageSync('latestSqbPrecreateResult', result);
				if (payType === 'balance') {
					uni.showToast({ title: '支付成功', icon: 'success' });
					this.goPaidOrderList();
					return;
				}
				const qrCodeUrl = this.getQrCodeUrl(result);
				this.openQrCodeUrl(qrCodeUrl);
			} catch (error) {
				const errMsg = (error && error.errMsg) || '';
				uni.showToast({
					title: errMsg.indexOf('cancel') !== -1 ? '已取消支付' : this.formatPayError(error),
					icon: 'none'
				});
			} finally {
				uni.hideLoading();
				this.payingOrderKey = '';
				this.pendingPayOrder = null;
				this.pendingPayIndex = -1;
			}
		},
		goPaidOrderList() {
			if (this.activeTab === '2') {
				this.fetchPalmOrderList();
				return;
			}
			uni.redirectTo({
				url: '/pages/users/palm_order_list/index?status=2'
			});
		},
		formatPayError(error) {
			const message = typeof error === 'string'
				? error
				: String((error && (error.message || error.msg || error.msgtext || error.errMsg)) || '');
			if (message.indexOf('client_sn') !== -1 || message.indexOf('clientSn') !== -1) {
				return '订单号不能为空';
			}
			if (message.indexOf('workOrderNo') !== -1) {
				return '工单号不能为空';
			}
			if (message.indexOf('total_amount') !== -1 || message.indexOf('totalAmount') !== -1) {
				return '支付金额不能为空';
			}
			if (message.indexOf('payer_uid') !== -1 || message.indexOf('openId') !== -1 || message.indexOf('openid') !== -1) {
				return 'openid不能为空';
			}
			if (message.indexOf('payType') !== -1) {
				return '支付方式不能为空';
			}
			if (message.indexOf('cannot be empty') !== -1) {
				return '参数不能为空';
			}
			return message || '发起支付失败';
		},
		handlePay(order) {
			uni.showToast({
				title: '支付接口待接入',
				icon: 'none'
			});
		},
		formatValue(value) {
			if (value === '' || value === null || value === undefined) return '-';
			if (typeof value === 'object') {
				try {
					return JSON.stringify(value);
				} catch (error) {
					return String(value);
				}
			}
			return String(value);
		},
		getPlateText(order, index) {
			order = order || {};
			return this.formatValue(order.carNumber || order.plateNo || order.vehicleNo || `车辆${index + 1}`);
		},
		formatAmountText(value) {
			const amount = this.formatValue(value);
			return amount === '-' ? '0.00元' : `${amount}元`;
		},
		getOrderInfoRows(order) {
			order = order || {};
			const fields = [
				{ key: '服务门店', value: order.tenantName, icon: '店', alwaysShow: true },
				{ key: '服务内容', value: this.getServiceItemsText(order.serviceItemsJson || order.ServiceItemsJson), icon: '服', alwaysShow: true },
				{ key: '接车时间', value: this.formatTime(order.createTime), icon: '时' },
				{ key: '车辆颜色', value: order.vehicleColor, icon: '车', alwaysShow: true },
				{ key: '客户称呼', value: order.customerName, icon: '客', alwaysShow: true },
				{ key: '手机号码', value: order.customerPhone, icon: '电', type: 'phone', alwaysShow: true }
			];
			return fields
				.filter(item => item.alwaysShow || (item.value !== '' && item.value !== null && item.value !== undefined))
				.map(item => ({
					key: item.key,
					icon: item.icon,
					type: item.type || '',
					value: this.formatValue(item.value)
				}));
		},
		parseServiceItems(value) {
			if (!value) return [];
			if (Array.isArray(value)) return value;
			if (typeof value === 'string') {
				const text = value.trim();
				if (!text) return [];
				try {
					const parsed = JSON.parse(text);
					return this.parseServiceItems(parsed);
				} catch (error) {
					return [text];
				}
			}
			if (value && typeof value === 'object') {
				const nested = value.serviceItems || value.serviceItemList || value.items || value.list || value.data;
				if (nested) return this.parseServiceItems(nested);
			}
			return [value];
		},
		getServiceItemName(item) {
			if (item === '' || item === null || item === undefined) return '';
			if (typeof item !== 'object') return String(item);
			const tags = [
				this.pickServiceValue(item, ['panelGroup', 'PanelGroup', 'positionName', 'PositionName', 'partPositionName', 'PartPositionName', 'typeName', 'TypeName', 'categoryName', 'CategoryName']),
				this.pickServiceValue(item, ['serviceName', 'ServiceName', 'serviceItemName', 'ServiceItemName', 'itemName', 'ItemName', 'name', 'Name', 'projectName', 'ProjectName', 'title', 'Title']),
				this.pickServiceValue(item, ['paintTypeName', 'PaintTypeName', 'brandName', 'BrandName', 'paintName', 'PaintName', 'qualityName', 'QualityName', 'specName', 'SpecName'])
			].filter(Boolean);
			if (tags.length) return tags.join('/');
			try {
				return JSON.stringify(item);
			} catch (error) {
				return '';
			}
		},
		pickServiceValue(item, keys) {
			item = item || {};
			for (let i = 0; i < keys.length; i++) {
				const value = item[keys[i]];
				if (value !== '' && value !== null && value !== undefined) return String(value);
			}
			return '';
		},
		getServiceItemsText(value) {
			return this.parseServiceItems(value)
				.map(item => this.getServiceItemName(item))
				.filter(Boolean)
				.join('、');
		},
		formatTime(value) {
			return value ? String(value).replace('T', ' ').slice(0, 19) : '';
		}
	}
};
</script>

<style scoped lang="scss">
.palm-order-page {
	height: 100vh;
	background: #f4f8ff;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.tabs-row {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	background: #ffffff;
	border-bottom: 0;
}

.tab-item {
	position: relative;
	flex: 1;
	height: 78rpx;
	line-height: 78rpx;
	text-align: center;
	font-size: 30rpx;
	color: #333333;
}

.tab-item.active {
	color: #1f7cff;
	font-weight: 700;
	background: transparent;
	box-shadow: none;
}

.tab-item.active::after {
	content: '';
	position: absolute;
	left: 50%;
	bottom: 8rpx;
	width: 56rpx;
	height: 6rpx;
	border-radius: 6rpx;
	background: #1f7cff;
	transform: translateX(-50%);
}

.filter-row {
	flex-shrink: 0;
	padding: 18rpx 40rpx 18rpx;
	display: flex;
	align-items: center;
	column-gap: 24rpx;
	background: #f4f8ff;
}

.filter-search-box,
.filter-date-box {
	height: 78rpx;
	border-radius: 10rpx;
	display: flex;
	align-items: center;
	box-sizing: border-box;
	background: #ffffff;
	box-shadow: 0 8rpx 20rpx rgba(31, 79, 168, 0.08);
}

.filter-search-box {
	flex: 1;
	min-width: 0;
	padding: 0 24rpx;
}

.filter-date-box {
	width: 260rpx;
	padding: 0 22rpx;
}

.filter-search-icon,
.filter-date-icon {
	flex-shrink: 0;
	position: relative;
	width: 34rpx;
	height: 34rpx;
	margin-right: 16rpx;
}

.filter-search-icon::before {
	content: '';
	position: absolute;
	left: 3rpx;
	top: 3rpx;
	width: 18rpx;
	height: 18rpx;
	border: 3rpx solid #3478f6;
	border-radius: 50%;
	box-sizing: border-box;
}

.filter-search-icon::after {
	content: '';
	position: absolute;
	right: 4rpx;
	bottom: 6rpx;
	width: 12rpx;
	height: 4rpx;
	border-radius: 4rpx;
	background: #3478f6;
	transform: rotate(45deg);
}

.filter-date-icon::before {
	content: '';
	position: absolute;
	left: 4rpx;
	top: 7rpx;
	width: 24rpx;
	height: 22rpx;
	border: 3rpx solid #3478f6;
	border-radius: 4rpx;
	box-sizing: border-box;
}

.filter-date-icon::after {
	content: '';
	position: absolute;
	left: 9rpx;
	top: 4rpx;
	width: 14rpx;
	height: 8rpx;
	border-left: 3rpx solid #3478f6;
	border-right: 3rpx solid #3478f6;
	box-sizing: border-box;
}

.filter-input {
	flex: 1;
	min-width: 0;
	height: 78rpx;
	font-size: 28rpx;
	color: #263347;
}

.filter-placeholder,
.filter-date-text {
	color: #8b96a8;
}

.filter-date-text {
	flex: 1;
	min-width: 0;
	font-size: 28rpx;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.filter-date-arrow {
	flex-shrink: 0;
	width: 14rpx;
	height: 14rpx;
	margin-left: 12rpx;
	border-right: 3rpx solid #7f8898;
	border-bottom: 3rpx solid #7f8898;
	transform: rotate(45deg) translateY(-3rpx);
}

.filter-date-clear {
	flex-shrink: 0;
	width: 32rpx;
	height: 32rpx;
	margin-left: 10rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	line-height: 1;
	color: #8b96a8;
	background: #eef2f8;
}

.content-scroll {
	flex: 1;
	height: 0;
	padding: 18rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.loading-box,
.empty-card {
	margin: 24rpx 20rpx;
	padding: 80rpx 24rpx;
	border-radius: 18rpx;
	text-align: center;
	font-size: 28rpx;
	color: #999999;
	background: #ffffff;
}

.order-card {
	margin-bottom: 22rpx;
	padding: 32rpx 34rpx 28rpx;
	border-radius: 18rpx;
	background: #ffffff;
	box-shadow: 0 14rpx 34rpx rgba(31, 79, 168, 0.08);
	overflow: hidden;
}

.card-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 20rpx;
	min-height: 52rpx;
}

.plate-main {
	display: flex;
	align-items: center;
	column-gap: 16rpx;
	flex: 1;
	min-width: 0;
}

.plate-icon,
.field-icon {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #1f7cff;
	background: #eef5ff;
}

.plate-icon {
	width: 46rpx;
	height: 46rpx;
	border-radius: 6rpx;
	font-size: 22rpx;
	font-weight: 700;
}

.plate-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #222222;
	word-break: break-all;
}

.status-pill {
	flex-shrink: 0;
	height: 42rpx;
	line-height: 42rpx;
	padding: 0 20rpx;
	border-radius: 21rpx;
	font-size: 24rpx;
	font-weight: 700;
	color: #7b61ff;
	background: #f1ecff;
}

.field-list {
	margin-top: 26rpx;
	padding: 0;
	background: #ffffff;
}

.field-row {
	min-height: 50rpx;
	display: flex;
	align-items: center;
	column-gap: 12rpx;
}

.field-icon {
	width: 28rpx;
	height: 28rpx;
	border-radius: 4rpx;
	font-size: 18rpx;
}

.field-key {
	flex-shrink: 0;
	font-size: 26rpx;
	color: #7f8898;
}

.field-value {
	font-size: 26rpx;
	color: #2b2f38;
	font-weight: 600;
	text-align: left;
	word-break: break-all;
}

.field-value.phone {
	color: #1f7cff;
}

.card-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 86rpx;
	margin-top: 24rpx;
	padding-top: 24rpx;
	border-top: 1rpx solid #eeeeee;
}

.amount-text {
	font-size: 28rpx;
	font-weight: 700;
	color: #ff2b2b;
}

.amount-text text {
	font-weight: 700;
}

.pay-button {
	min-width: 88rpx;
	height: 58rpx;
	padding: 0 24rpx;
	border: 2rpx solid #1f7cff;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	font-size: 27rpx;
	font-weight: 700;
	color: #1f7cff;
	background: #ffffff;
	box-shadow: none;
}

.pay-mask {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	z-index: 90;
	background: rgba(15, 23, 42, 0.45);
}

.pay-panel {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 91;
	padding: 26rpx 30rpx 42rpx;
	border-radius: 24rpx 24rpx 0 0;
	box-sizing: border-box;
	background: #ffffff;
	transform: translateY(110%);
	transition: transform 0.22s ease;
}

.pay-panel.show {
	transform: translateY(0);
}

.pay-panel-title {
	padding: 8rpx 0 26rpx;
	text-align: center;
	font-size: 32rpx;
	font-weight: 700;
	color: #0f172a;
}

.pay-panel-option {
	min-height: 112rpx;
	display: flex;
	align-items: center;
	column-gap: 20rpx;
	border-bottom: 1rpx solid #edf2f7;
}

.pay-option-icon {
	flex-shrink: 0;
	width: 58rpx;
	height: 58rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: 700;
	color: #ffffff;
}

.balance-icon {
	background: #f59e0b;
}

.wx-icon {
	background: #22c55e;
}

.pay-option-main {
	flex: 1;
	min-width: 0;
}

.pay-option-name {
	font-size: 30rpx;
	font-weight: 700;
	color: #1f2937;
}

.pay-option-desc {
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #94a3b8;
}

.pay-option-arrow {
	flex-shrink: 0;
	font-size: 42rpx;
	color: #cbd5e1;
}

.pay-panel-cancel {
	height: 78rpx;
	margin-top: 24rpx;
	border-radius: 39rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: 700;
	color: #64748b;
	background: #f1f5f9;
}
</style>
