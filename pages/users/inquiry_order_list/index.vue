<template>
	<view class="inquiry-order-page">
		<view class="nav-shell" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="nav-row" :style="{ height: navContentHeight + 'px' }">
				<view class="nav-back" @click="handleBack">
					<view class="nav-back-line nav-back-line-top"></view>
					<view class="nav-back-line nav-back-line-bottom"></view>
				</view>
				<text class="nav-title">询价订单</text>
				<view class="nav-actions">
					<view class="nav-action">···</view>
					<view class="nav-action">◎</view>
				</view>
			</view>
			<view class="nav-subcopy">
				<text class="nav-subtitle">查看订单状态、商品明细和金额</text>
				<view class="filter-trigger" @click="openFilterSheet">筛选</view>
			</view>
			<view class="search-row">
				<view class="search-box">
					<view class="search-icon"></view>
					<input
						v-model="searchKeyword"
						class="search-input"
						type="text"
						placeholder="输入商品或订单号搜索"
						placeholder-class="search-placeholder"
						confirm-type="search"
						@confirm="handleSearch"
					/>
				</view>
			</view>
		</view>

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

		<scroll-view scroll-y class="content-scroll">
			<view v-if="loading && !orderList.length" class="empty-state">订单加载中...</view>
			<view v-else-if="!filteredOrders.length" class="empty-state">暂无订单</view>

			<view v-for="order in filteredOrders" :key="order.id" class="order-card">
				<view class="order-head">
					<view class="order-head-main">
						<text class="order-no">{{ order.orderNo }}</text>
						<text class="order-time">{{ order.createTime }}</text>
					</view>
					<text class="status-pill" :class="order.statusClass">{{ order.statusLabel }}</text>
				</view>

				<view class="contact-box">
					<view class="contact-content">
						<view class="contact-line">
							<view class="contact-icon contact-user-icon"></view>
							<text class="contact-label">联系人</text>
							<text class="contact-value">{{ order.contactName || '-' }}</text>
						</view>
						<view class="contact-line">
							<view class="contact-icon contact-phone-icon"></view>
							<text class="contact-label">电话</text>
							<text class="contact-value">{{ order.contactPhone || '-' }}</text>
						</view>
						<view class="contact-line">
							<view class="contact-icon contact-order-icon"></view>
							<text class="contact-label">询价单</text>
							<text class="contact-value">{{ order.inquiryNo || '-' }}</text>
						</view>
						<view v-if="order.merchantOrderNo" class="contact-line">
							<view class="contact-icon contact-order-icon"></view>
							<text class="contact-label">商家订单</text>
							<text class="contact-value">{{ order.merchantOrderNo }}</text>
						</view>
					</view>
				</view>
				<view class="section-divider"></view>

				<view v-for="goods in order.goodsList" :key="goods.id" class="goods-row">
					<view class="goods-main">
						<text class="goods-name">{{ goods.name }}</text>
						<text class="goods-code">{{ goods.code }}</text>
					</view>
					<view class="goods-price">
						<text class="price-line">订单单价 {{ goods.orderPrice }}</text>
						<text class="price-line">x{{ goods.count }}</text>
						<text class="goods-total">¥{{ goods.totalPrice }}</text>
					</view>
				</view>

				<view class="card-footer">
					<view class="footer-price">
						<view class="order-amount-row">
							<text class="order-amount-label">订单金额</text>
							<text class="order-amount">¥{{ order.orderAmount }}</text>
						</view>
					</view>
					<view class="footer-action" :class="order.buttonClass" @click="handleOrderAction(order)">{{ order.buttonText }}</view>
				</view>
			</view>
		</scroll-view>

		<view v-if="showFilterSheet" class="filter-mask" @click="closeFilterSheet">
			<view class="filter-sheet" @click.stop>
				<view class="filter-sheet-head">
					<text class="filter-sheet-title">订单筛选</text>
					<text class="filter-sheet-close" @click="closeFilterSheet">关闭</text>
				</view>

				<view class="filter-form">
					<view class="filter-item">
						<text class="filter-label">询价单号</text>
						<input
							v-model="filterForm.externalInquiryId"
							class="filter-input"
							type="text"
							placeholder="请输入询价单号"
							placeholder-class="filter-placeholder"
						/>
					</view>

					<view class="filter-item">
						<text class="filter-label">联系人姓名</text>
						<input
							v-model="filterForm.contactName"
							class="filter-input"
							type="text"
							placeholder="请输入联系人姓名"
							placeholder-class="filter-placeholder"
						/>
					</view>

					<view class="filter-item">
						<text class="filter-label">联系人手机</text>
						<input
							v-model="filterForm.contactNumber"
							class="filter-input"
							type="text"
							placeholder="请输入联系人手机号码"
							placeholder-class="filter-placeholder"
						/>
					</view>

					<view class="filter-item">
						<text class="filter-label">开始时间</text>
						<picker mode="date" :value="filterForm.beginOpTime" @change="handleFilterDateChange('beginOpTime', $event)">
							<view class="filter-picker">{{ filterForm.beginOpTime || '请选择开始时间' }}</view>
						</picker>
					</view>

					<view class="filter-item">
						<text class="filter-label">结束时间</text>
						<picker mode="date" :value="filterForm.endOpTime" @change="handleFilterDateChange('endOpTime', $event)">
							<view class="filter-picker">{{ filterForm.endOpTime || '请选择结束时间' }}</view>
						</picker>
					</view>
				</view>

				<view class="filter-actions">
					<view class="filter-action filter-action-secondary" @click="resetFilterForm">重置</view>
					<view class="filter-action filter-action-primary" @click="applyFilter">确定</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const TAB_STATUS_MAP = {
	all: null,
	pending: 1,
	delivering: 2,
	shipping: 3,
	completed: 4
};

export default {
	data() {
		return {
			statusBarHeight: 20,
			navContentHeight: 44,
			activeTab: 'all',
			searchKeyword: '',
			loading: false,
			showFilterSheet: false,
			filterForm: {
				externalInquiryId: '',
				contactName: '',
				contactNumber: '',
				beginOpTime: '',
				endOpTime: ''
			},
			tabs: [
				{ label: '全部', value: 'all' },
				{ label: '待支付', value: 'pending' },
				{ label: '待发货', value: 'delivering' },
				{ label: '待收货', value: 'shipping' },
				{ label: '已完成', value: 'completed' }
			],
			orderList: []
		};
	},
	computed: {
		filteredOrders() {
			const keyword = String(this.searchKeyword || '').trim().toLowerCase();
			let list = this.orderList;
			if (this.activeTab !== 'all') {
				list = list.filter(item => item.status === this.activeTab);
			}
			if (!keyword) {
				return list;
			}
			return list.filter(item => {
				const orderText = [
					item.orderNo,
					item.inquiryNo,
					item.contactName,
					item.contactPhone,
					item.merchantOrderNo
				]
					.filter(Boolean)
					.join(' ')
					.toLowerCase();
				const goodsText = (item.goodsList || [])
					.map(goods => [goods.name, goods.code].filter(Boolean).join(' '))
					.join(' ')
					.toLowerCase();
				return `${orderText} ${goodsText}`.includes(keyword);
			});
		}
	},
	onLoad(options) {
		const info = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {};
		const statusBarHeight = info.statusBarHeight || 20;
		let navContentHeight = 44;

		if (options && options.status !== undefined) {
			const statusMap = {
				0: 'pending',
				1: 'delivering',
				2: 'shipping',
				3: 'completed',
				4: 'completed',
				5: 'all',
				6: 'all'
			};
			this.activeTab = statusMap[options.status] || 'all';
		}

		// #ifdef MP-WEIXIN
		const menuButton = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null;
		if (menuButton && menuButton.height) {
			navContentHeight = Math.max(menuButton.height + 12, 44);
		}
		// #endif

		this.statusBarHeight = statusBarHeight;
		this.navContentHeight = navContentHeight;
		this.fetchOrders();
	},
	methods: {
		handleBack() {
			uni.navigateBack({ delta: 1 });
		},
		handleSearch() {
			this.searchKeyword = String(this.searchKeyword || '').trim();
		},
		openFilterSheet() {
			this.showFilterSheet = true;
		},
		closeFilterSheet() {
			this.showFilterSheet = false;
		},
		handleFilterDateChange(field, event) {
			if (!field) {
				return;
			}
			const value = event && event.detail ? event.detail.value : '';
			this.filterForm = {
				...this.filterForm,
				[field]: value || ''
			};
		},
		resetFilterForm() {
			this.filterForm = {
				externalInquiryId: '',
				contactName: '',
				contactNumber: '',
				beginOpTime: '',
				endOpTime: ''
			};
			this.closeFilterSheet();
			this.fetchOrders();
		},
		applyFilter() {
			this.closeFilterSheet();
			this.fetchOrders();
		},
		handleTabChange(tabValue) {
			if (this.activeTab === tabValue) {
				return;
			}
			this.activeTab = tabValue;
			this.fetchOrders();
		},
		getUserPayload() {
			const getters = (this.$store && this.$store.getters) || {};
			const userInfo = getters.userInfo || {};
			return {
				userId: Number(getters.uid || 0) || 0,
				mobile: String(userInfo.phone || '').trim()
			};
		},
		buildOrderSearchPayload() {
			const { userId, mobile } = this.getUserPayload();
			const payload = {
				pagesize: 200,
				pageno: 1,
				userId,
				mobile
			};
			const filters = this.filterForm || {};
			const orderStatus = TAB_STATUS_MAP[this.activeTab];
			if (orderStatus) {
				payload.orderStatus = orderStatus;
			}
			if (filters.externalInquiryId) {
				payload.externalInquiryId = String(filters.externalInquiryId).trim();
			}
			if (filters.contactName) {
				payload.contactName = String(filters.contactName).trim();
			}
			if (filters.contactNumber) {
				payload.contactNumber = String(filters.contactNumber).trim();
			}
			if (filters.beginOpTime) {
				payload.beginOpTime = `${filters.beginOpTime} 00:00:00`;
			}
			if (filters.endOpTime) {
				payload.endOpTime = `${filters.endOpTime} 23:59:59`;
			}
			Object.keys(payload).forEach(key => {
				if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
					delete payload[key];
				}
			});
			return payload;
		},
		requestOrderList(payload) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/Order/GetList',
					method: 'POST',
					data: payload,
					success: resolve,
					fail: reject
				});
			});
		},
		requestOrderProducts(payload) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/OrderProduct/GetList',
					method: 'POST',
					data: payload,
					success: resolve,
					fail: reject
				});
			});
		},
		requestPayOrder(payload) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/PayOrder',
					method: 'POST',
					data: payload,
					success: resolve,
					fail: reject
				});
			});
		},
		extractList(data) {
			if (Array.isArray(data)) return data;
			if (Array.isArray(data && data.data)) return data.data;
			if (Array.isArray(data && data.list)) return data.list;
			if (Array.isArray(data && data.rows)) return data.rows;
			if (Array.isArray(data && data.items)) return data.items;
			if (Array.isArray(data && data.result)) return data.result;
			if (Array.isArray(data && data.records)) return data.records;
			return [];
		},
		formatMoney(value) {
			const amount = Number(value || 0) || 0;
			return amount.toFixed(2);
		},
		formatTime(value) {
			if (!value) {
				return '';
			}
			return String(value).replace('T', ' ').slice(0, 19);
		},
		getCurrentOpenId() {
			const getters = (this.$store && this.$store.getters) || {};
			const storeUserInfo = getters.userInfo || {};
			const cachedUserInfo = uni.getStorageSync('USER_INFO') || {};
			return String(
				storeUserInfo.openId ||
				storeUserInfo.openid ||
				cachedUserInfo.openId ||
				cachedUserInfo.openid ||
				''
			).trim();
		},
		buildPayOrderPayload(order) {
			const getters = (this.$store && this.$store.getters) || {};
			const userInfo = getters.userInfo || {};
			return {
				userId: Number(getters.uid || 0) || 0,
				mobile: String(userInfo.phone || '').trim(),
				userName: userInfo.nickname || userInfo.realName || '',
				id: Number(order.id || 0) || 0,
				orderId: order.orderNo || '',
				useWxJsapiPay: true,
				openId: this.getCurrentOpenId()
			};
		},
		getPayConfigFromResult(result) {
			const data = (result && result.data) || {};
			const wxJsapiPay = data.wxJsapiPay || {};
			return {
				timeStamp: String(wxJsapiPay.timeStamp || ''),
				nonceStr: String(wxJsapiPay.nonceStr || ''),
				package: String(wxJsapiPay.package || ''),
				signType: String(wxJsapiPay.signType || 'RSA'),
				paySign: String(wxJsapiPay.paySign || '')
			};
		},
		hasCompletePayConfig(payConfig) {
			return !!(
				payConfig &&
				payConfig.timeStamp &&
				payConfig.nonceStr &&
				payConfig.package &&
				payConfig.paySign
			);
		},
		requestJsapiPayment(payConfig) {
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
		getOrderStatusMeta(item) {
			const status = Number(item.orderStatus || 0);
			if (status === 1) {
				return {
					status: 'pending',
					statusLabel: '待支付',
					statusClass: 'is-pending',
					buttonText: '去支付',
					buttonClass: 'primary'
				};
			}
			if (status === 2) {
				return {
					status: 'delivering',
					statusLabel: '待发货',
					statusClass: 'is-delivering',
					buttonText: '待发货',
					buttonClass: 'secondary'
				};
			}
			if (status === 3) {
				return {
					status: 'shipping',
					statusLabel: '待收货',
					statusClass: 'is-shipping',
					buttonText: '待收货',
					buttonClass: 'secondary'
				};
			}
			if (status === 4) {
				return {
					status: 'completed',
					statusLabel: '已完成',
					statusClass: 'is-completed',
					buttonText: '已完成',
					buttonClass: 'secondary'
				};
			}
			if (status === 5) {
				return {
					status: 'returning',
					statusLabel: '退货中',
					statusClass: 'is-completed',
					buttonText: '退货中',
					buttonClass: 'secondary'
				};
			}
			if (status === 6) {
				return {
					status: 'returned',
					statusLabel: '已完成退货',
					statusClass: 'is-completed',
					buttonText: '已完成退货',
					buttonClass: 'secondary'
				};
			}
			if (item.outboundTime) {
				return {
					status: 'shipping',
					statusLabel: '待收货',
					statusClass: 'is-shipping',
					buttonText: '待收货',
					buttonClass: 'secondary'
				};
			}
			if (item.payTime || Number(item.ksStatus || 0) === 1) {
				return {
					status: 'delivering',
					statusLabel: '待发货',
					statusClass: 'is-delivering',
					buttonText: '待发货',
					buttonClass: 'secondary'
				};
			}
			return {
				status: 'completed',
				statusLabel: '已完成',
				statusClass: 'is-completed',
				buttonText: '已完成',
				buttonClass: 'secondary'
			};
		},
		normalizeGoodsItem(item, index) {
			const count = Number(item.productNumber || 0) || 0;
			const totalAmount = Number(item.totalAmount || 0) || 0;
			const orderAmount = Number(item.addPriceAmount || item.totalAmount || 0) || 0;
			const unitOrderPrice = count > 0 ? orderAmount / count : orderAmount;
			return {
				id: item.id || `${item.orderId || 'goods'}-${index}`,
				name: item.productName || '商品',
				code: item.thirdUuid || item.thirdOrderNo || '',
				basePrice: this.formatMoney(item.productPrice || 0),
				orderPrice: this.formatMoney(unitOrderPrice),
				count: count || 1,
				baseTotal: this.formatMoney(totalAmount),
				totalPrice: this.formatMoney(orderAmount)
			};
		},
		normalizeOrderGoodsFromOrder(item) {
			return [
				this.normalizeGoodsItem(
					{
						id: item.id,
						orderId: item.orderId,
						productName: item.productName || item.partsName || item.goodsName || '商品',
						thirdUuid: item.thirdUuid || item.productCode || item.partsCode || item.thirdOrderNo || '',
						productPrice: item.productPrice || item.unitPrice || item.price || 0,
						productNumber: item.productNumber || item.count || item.qty || 1,
						totalAmount: item.totalAmount || item.productAmount || item.payAmount || 0,
						addPriceAmount: item.payAmount || item.totalAmount || 0
					},
					0
				)
			];
		},
		async fetchOrderProducts(orderIds) {
			const { userId, mobile } = this.getUserPayload();
			const tasks = orderIds.map(async orderId => {
				try {
					const response = await this.requestOrderProducts({
						pagesize: 200,
						pageno: 1,
						userId,
						mobile,
						orderId
					});
					const body = response.data || {};
					if (body.msgid !== 200) {
						return [orderId, []];
					}
					const list = this.extractList(body.data);
					return [orderId, list.map((item, index) => this.normalizeGoodsItem(item, index))];
				} catch (error) {
					return [orderId, []];
				}
			});
			const entries = await Promise.all(tasks);
			return entries.reduce((result, [orderId, list]) => {
				result[orderId] = list;
				return result;
			}, {});
		},
		normalizeOrderItem(item, goodsMap) {
			const statusMeta = this.getOrderStatusMeta(item);
			const orderKey = Number(item.id || 0) || item.id || item.orderId;
			return {
				id: orderKey,
				orderNo: item.orderId || '',
				createTime: this.formatTime(item.opTime),
				contactName: item.contactName || item.userName || '',
				contactPhone: item.contactNumber || item.mobile || '',
				inquiryNo: item.externalInquiryId || '',
				merchantOrderNo: item.thirdOrderNo || '',
				baseAmount: this.formatMoney(item.totalAmount || 0),
				orderAmount: this.formatMoney(item.payAmount || item.totalAmount || 0),
				goodsList: goodsMap[orderKey] || [],
				...statusMeta
			};
		},
		async fetchOrders() {
			this.loading = true;
			try {
				const response = await this.requestOrderList(this.buildOrderSearchPayload());
				const body = response.data || {};
				if (body.msgid !== 200) {
					throw new Error(body.msg || '加载订单失败');
				}
				const list = this.extractList(body.data);
				const orderIds = list.map(item => Number(item.id || 0)).filter(Boolean);
				const goodsMap = orderIds.length ? await this.fetchOrderProducts(orderIds) : {};
				this.orderList = list
					.map(item => this.normalizeOrderItem(item, goodsMap))
					.sort((a, b) => {
						const timeA = a.createTime ? new Date(a.createTime).getTime() : 0;
						const timeB = b.createTime ? new Date(b.createTime).getTime() : 0;
						return timeB - timeA;
					});
			} catch (error) {
				this.orderList = [];
				uni.showToast({
					title: (error && error.message) || '加载订单失败',
					icon: 'none'
				});
			} finally {
				this.loading = false;
			}
		},
		async handleOrderAction(order) {
			if (!order || order.status !== 'pending') return;
			const payload = this.buildPayOrderPayload(order);
			if (!payload.id || !payload.orderId) {
				uni.showToast({
					title: '缺少订单信息',
					icon: 'none'
				});
				return;
			}
			if (!payload.openId) {
				uni.showToast({
					title: '未获取到openId，请重新登录后再试',
					icon: 'none'
				});
				return;
			}
			uni.setStorageSync('latestMiniPayOrderRequestBody', payload);
			uni.showLoading({
				title: '正在发起支付',
				mask: true
			});
			try {
				const response = await this.requestPayOrder(payload);
				const body = response.data || {};
				if (Number(body.msgid) !== 200) {
					uni.showToast({
						title: body.msgtext || '发起支付失败',
						icon: 'none'
					});
					return;
				}
				uni.setStorageSync('latestMiniPayOrderResult', body.data || {});
				const payConfig = this.getPayConfigFromResult(body);
				uni.setStorageSync('latestMiniPayOrderPayConfig', payConfig);
				if (!this.hasCompletePayConfig(payConfig)) {
					uni.showToast({
						title: '未返回支付参数',
						icon: 'none'
					});
					await this.fetchOrders();
					return;
				}
				await this.requestJsapiPayment(payConfig);
				uni.showToast({
					title: '支付成功',
					icon: 'success'
				});
				await this.fetchOrders();
			} catch (error) {
				const errMsg = (error && error.errMsg) || '';
				uni.showToast({
					title: errMsg.indexOf('cancel') !== -1 ? '已取消支付' : '支付失败，请稍后重试',
					icon: 'none'
				});
				await this.fetchOrders();
			} finally {
				uni.hideLoading();
			}
		}
	}
};
</script>

<style scoped lang="scss">
.inquiry-order-page {
	height: 100vh;
	background: linear-gradient(180deg, #f7f9ff 0%, #eef3fb 100%);
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.nav-shell {
	flex-shrink: 0;
	background: #ffffff;
	box-shadow: 0 8rpx 24rpx rgba(37, 70, 123, 0.06);
}

.nav-row {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 22rpx;
}

.nav-back {
	position: absolute;
	left: 22rpx;
	top: 50%;
	width: 56rpx;
	height: 56rpx;
	transform: translateY(-50%);
}

.nav-back-line {
	position: absolute;
	left: 16rpx;
	width: 4rpx;
	height: 26rpx;
	border-radius: 999rpx;
	background: #303133;
	transform-origin: center;
}

.nav-back-line-top {
	top: 10rpx;
	transform: rotate(45deg);
}

.nav-back-line-bottom {
	top: 24rpx;
	transform: rotate(-45deg);
}

.nav-title {
	font-size: 30rpx;
	font-weight: 500;
	line-height: 1;
	color: #202534;
}

.nav-subcopy {
	position: relative;
	padding-top: 4rpx;
	text-align: center;
}

.nav-subtitle {
	font-size: 24rpx;
	color: #7d8796;
}

.filter-trigger {
	position: absolute;
	right: 28rpx;
	top: 0;
	height: 44rpx;
	padding: 0 18rpx;
	border-radius: 22rpx;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 22rpx;
	font-weight: 600;
	color: #f2563d;
	background: #fff1ef;
	border: 1rpx solid rgba(242, 86, 61, 0.18);
}

.nav-actions {
	position: absolute;
	right: 16rpx;
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	column-gap: 14rpx;
}

.nav-action {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	font-weight: 600;
	color: #3f7cff;
	background: #edf4ff;
}

.search-row {
	display: flex;
	align-items: center;
	padding: 18rpx 24rpx 14rpx;
	column-gap: 20rpx;
}

.search-box {
	flex: 1;
	height: 60rpx;
	padding: 0 22rpx;
	border-radius: 30rpx;
	display: flex;
	align-items: center;
	background: #f4f5f7;
}

.search-icon {
	position: relative;
	width: 24rpx;
	height: 24rpx;
	margin-right: 12rpx;
	flex-shrink: 0;
}

.search-icon::before {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	width: 16rpx;
	height: 16rpx;
	border: 2rpx solid #b3b8c3;
	border-radius: 50%;
	box-sizing: border-box;
}

.search-icon::after {
	content: '';
	position: absolute;
	right: 1rpx;
	bottom: 2rpx;
	width: 8rpx;
	height: 2rpx;
	border-radius: 999rpx;
	background: #b3b8c3;
	transform: rotate(45deg);
	transform-origin: center;
}

.search-input {
	flex: 1;
	height: 60rpx;
	font-size: 26rpx;
	color: #333a48;
}

.search-placeholder {
	color: #b3b8c3;
}

.tabs-row {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 22rpx;
	background: #ffffff;
	border-bottom: 1rpx solid #edf1f7;
}

.tab-item {
	position: relative;
	flex: 1;
	padding: 18rpx 0 16rpx;
	text-align: center;
	font-size: 28rpx;
	font-weight: 500;
	color: #697386;
}

.tab-item.active {
	color: #f2563d;
	font-weight: 700;
}

.tab-item.active::after {
	content: '';
	position: absolute;
	left: 24rpx;
	right: 24rpx;
	bottom: 0;
	height: 4rpx;
	border-radius: 999rpx;
	background: #f2563d;
}

.content-scroll {
	flex: 1;
	height: 0;
	padding: 18rpx 18rpx 30rpx;
	box-sizing: border-box;
}

.order-card {
	margin-bottom: 22rpx;
	padding: 26rpx;
	border-radius: 28rpx;
	background: #ffffff;
	box-shadow: 0 18rpx 36rpx rgba(52, 84, 140, 0.08);
}

.order-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	column-gap: 20rpx;
}

.order-head-main {
	flex: 1;
	min-width: 0;
}

.order-no {
	display: block;
	font-size: 30rpx;
	font-weight: 800;
	line-height: 1.3;
	color: #1f2940;
	word-break: break-all;
}

.order-time {
	display: block;
	margin-top: 8rpx;
	font-size: 24rpx;
	color: #9098a6;
}

.status-pill {
	flex-shrink: 0;
	padding: 10rpx 20rpx;
	border-radius: 18rpx;
	font-size: 24rpx;
	font-weight: 600;
}

.is-pending,
.is-shipping,
.is-delivering,
.is-completed {
	color: #e34d3f;
	background: #fff1ef;
}

.contact-box {
	margin-top: 18rpx;
	padding: 20rpx 22rpx;
	border-radius: 20rpx;
	background: #f5f7fc;
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 18rpx;
}

.contact-content {
	flex: 1;
	min-width: 0;
}

.contact-line {
	display: flex;
	align-items: center;
	min-width: 0;
	font-size: 26rpx;
	line-height: 1.8;
	color: #697385;
}

.contact-icon {
	flex-shrink: 0;
	width: 32rpx;
	height: 32rpx;
	margin-right: 14rpx;
	border-radius: 50%;
	position: relative;
	background: #e6f0ff;
}

.contact-user-icon::before {
	content: '';
	position: absolute;
	left: 11rpx;
	top: 7rpx;
	width: 10rpx;
	height: 10rpx;
	border-radius: 50%;
	background: #68a5ff;
}

.contact-user-icon::after {
	content: '';
	position: absolute;
	left: 8rpx;
	bottom: 6rpx;
	width: 16rpx;
	height: 10rpx;
	border-radius: 10rpx 10rpx 6rpx 6rpx;
	background: #68a5ff;
}

.contact-phone-icon::before {
	content: '';
	position: absolute;
	left: 10rpx;
	top: 7rpx;
	width: 10rpx;
	height: 18rpx;
	border-radius: 5rpx;
	background: #68a5ff;
	transform: rotate(-26deg);
}

.contact-phone-icon::after {
	content: '';
	position: absolute;
	left: 13rpx;
	top: 9rpx;
	width: 7rpx;
	height: 14rpx;
	border-radius: 4rpx;
	background: #e6f0ff;
	transform: rotate(-26deg);
}

.contact-order-icon::before {
	content: '';
	position: absolute;
	left: 9rpx;
	top: 7rpx;
	width: 14rpx;
	height: 18rpx;
	border-radius: 3rpx;
	background: #68a5ff;
}

.contact-order-icon::after {
	content: '';
	position: absolute;
	left: 12rpx;
	top: 12rpx;
	width: 8rpx;
	height: 2rpx;
	border-radius: 2rpx;
	background: #e6f0ff;
	box-shadow: 0 5rpx 0 #e6f0ff;
}

.contact-label {
	flex-shrink: 0;
	margin-right: 10rpx;
	color: #697385;
}

.contact-value {
	min-width: 0;
	color: #697385;
	word-break: break-all;
}

.section-divider {
	height: 1rpx;
	margin-top: 22rpx;
	background: #edf1f6;
}

.goods-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	column-gap: 24rpx;
	padding: 28rpx 0;
	border-bottom: 1rpx solid #edf1f6;
}

.goods-row:last-of-type {
	border-bottom: 0;
}

.goods-main {
	flex: 1;
	min-width: 0;
}

.goods-name {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	line-height: 1.4;
	color: #1d2433;
}

.goods-code {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #98a1af;
	word-break: break-all;
}

.goods-price {
	min-width: 214rpx;
	text-align: right;
}

.price-line {
	display: block;
	font-size: 24rpx;
	line-height: 1.7;
	color: #6c7687;
}

.goods-total {
	display: block;
	margin-top: 10rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: #f2524a;
	line-height: 1;
}

.card-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 22rpx;
	padding-top: 10rpx;
}

.footer-price {
	flex: 1;
	min-width: 0;
}

.base-total {
	display: block;
	font-size: 24rpx;
	color: #7f8898;
}

.order-amount-row {
	margin-top: 0;
	display: flex;
	align-items: baseline;
	flex-wrap: wrap;
}

.order-amount-label {
	font-size: 28rpx;
	font-weight: 700;
	color: #eb4a43;
}

.order-amount {
	margin-left: 10rpx;
	font-size: 28rpx;
	font-weight: 800;
	line-height: 1;
	color: #eb4a43;
}

.footer-action {
	flex-shrink: 0;
	min-width: 160rpx;
	height: 68rpx;
	padding: 0 20rpx;
	border-radius: 34rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: 700;
	box-sizing: border-box;
}

.footer-action.primary,
.footer-action.secondary {
	color: #ffffff;
	background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
	box-shadow: 0 12rpx 24rpx rgba(37, 99, 235, 0.24);
}

.empty-state {
	padding-top: 220rpx;
	text-align: center;
	font-size: 28rpx;
	color: #a2a9b5;
}

.filter-mask {
	position: fixed;
	inset: 0;
	z-index: 99;
	display: flex;
	align-items: flex-end;
	background: rgba(16, 24, 40, 0.32);
}

.filter-sheet {
	width: 100%;
	padding: 28rpx 24rpx calc(28rpx + env(safe-area-inset-bottom));
	border-radius: 28rpx 28rpx 0 0;
	background: #ffffff;
	box-sizing: border-box;
}

.filter-sheet-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24rpx;
}

.filter-sheet-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #1f2940;
}

.filter-sheet-close {
	font-size: 24rpx;
	color: #8b94a3;
}

.filter-form {
	display: flex;
	flex-direction: column;
	row-gap: 20rpx;
}

.filter-item {
	display: flex;
	flex-direction: column;
	row-gap: 12rpx;
}

.filter-label {
	font-size: 24rpx;
	font-weight: 600;
	color: #4a5568;
}

.filter-input,
.filter-picker {
	height: 76rpx;
	padding: 0 22rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	font-size: 26rpx;
	color: #1f2940;
	background: #f6f7fb;
	box-sizing: border-box;
}

.filter-placeholder {
	color: #b3b8c3;
}

.filter-actions {
	display: flex;
	column-gap: 18rpx;
	margin-top: 28rpx;
}

.filter-action {
	flex: 1;
	height: 82rpx;
	border-radius: 22rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: 700;
}

.filter-action-secondary {
	color: #5e6778;
	background: #eef2f8;
}

.filter-action-primary {
	color: #ffffff;
	background: linear-gradient(135deg, #ff7a66 0%, #e34d3f 100%);
	box-shadow: 0 12rpx 24rpx rgba(227, 77, 63, 0.24);
}
</style>
