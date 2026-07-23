<template>
	<view class="detail-page">
		<view v-if="loading" class="state-card">加载中...</view>
		<view v-else-if="!hasContent" class="state-card">
			<text>暂无详情数据</text>
			<view class="reload-button" @click="fetchDetail">重新加载</view>
		</view>

		<scroll-view
			v-else
			scroll-y
			class="detail-scroll"
			:class="{ 'has-image-tabs': imageGroupList.length }"
			scroll-with-animation
			:scroll-into-view="scrollIntoViewId"
		>
			<view v-if="hasBasicInfo" class="content-card basic-card">
				<view class="basic-head">
					<text class="plate-title">{{ plateText }}</text>
					<text v-if="basicStatusText" class="basic-status">{{ basicStatusText }}</text>
				</view>
				<view class="section-title basic-title">
					<text>基本信息</text>
				</view>
				<view class="basic-list">
					<view v-for="row in basicInfoRows" :key="row.label" class="basic-row">
						<text class="info-label">{{ row.label }}</text>
						<view v-if="row.copyable" class="customer-value-wrap">
							<text class="info-value basic-value">{{ row.value }}</text>
							<view v-if="row.rawValue" class="copy-button" :data-text="row.rawValue" @tap.stop="copyText">复制</view>
						</view>
						<text v-else class="info-value basic-value">{{ row.value }}</text>
					</view>
				</view>
			</view>

			<view v-if="hasCustomerInfo" class="content-card customer-card">
				<view class="section-title basic-title">
					<text>客户信息</text>
				</view>
				<view class="basic-list">
					<view v-for="row in customerInfoRows" :key="row.label" class="basic-row">
						<text class="info-label">{{ row.label }}</text>
						<view class="customer-value-wrap">
							<text class="info-value basic-value">{{ row.value }}</text>
							<view v-if="row.copyable && row.rawValue" class="copy-button" :data-text="row.rawValue" @tap.stop="copyText">复制</view>
						</view>
					</view>
				</view>
			</view>

			<view id="summary-card" class="content-card summary-card">
				<view class="section-title">
					<view class="section-bar"></view>
					<text>服务内容</text>
				</view>

				<view class="summary-list">
					<view v-for="row in summaryRows" :key="row.label" class="summary-row">
						<view class="summary-left">
							<text class="info-label">{{ row.label }}</text>
						</view>
						<view v-if="row.actionText" class="summary-action-wrap">
							<text class="info-value" :class="row.className">{{ row.value }}</text>
							<view class="summary-pay-button" @tap.stop="handleSummaryPay">{{ row.actionText }}</view>
						</view>
						<text v-else class="info-value" :class="row.className">{{ row.value }}</text>
					</view>
				</view>
			</view>

			<view class="content-card detail-card">
				<view class="section-title">
					<view class="section-bar"></view>
					<text>服务明细</text>
				</view>
				<view class="detail-list">
					<view v-if="!serviceDetailList.length" class="detail-empty">服务明细暂无数据</view>
					<view v-for="(item, index) in serviceDetailList" :key="'service-' + index" class="detail-item-row">
						<view class="detail-main">
							<text class="detail-name">{{ getDetailName(item, index) }}</text>
							<text v-if="getDetailSubText(item)" class="detail-sub">{{ getDetailSubText(item) }}</text>
						</view>
						<view class="detail-right">
							<text class="detail-price">¥ {{ getItemPriceText(item) }}</text>
							<text v-if="item.type === 'service'" class="detail-count">×{{ getItemQty(item) }}</text>
						</view>
					</view>
				</view>
			</view>

			<view v-if="imageGroupList.length" class="content-card image-card">
				<view class="section-title">
					<view class="section-bar"></view>
					<text>图片信息</text>
				</view>
				<view class="image-group-list">
					<view v-for="group in imageGroupList" :id="'image-group-' + group.type" :key="group.type" class="image-group">
						<view class="image-group-title">{{ group.label }}</view>
						<view class="image-grid">
							<image
								v-for="(item, index) in group.items"
								:key="group.type + '-' + index"
								class="order-image"
								:src="item.imageUrl"
								mode="aspectFill"
								:data-url="item.imageUrl"
								@click="previewImage"
							></image>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>

		<view v-if="imageGroupList.length" class="image-type-fixed">
			<view class="image-type-tabs">
				<view
					v-for="tab in imageTypeTabs"
					:key="tab.type"
					class="image-type-tab"
					:class="{ active: activeImageType === tab.type }"
					:data-type="tab.type"
					@tap="setActiveImageType"
				>
					{{ tab.text }}
				</view>
				<view v-if="!isPaid()" class="image-type-tab image-pay-tab" @tap.stop="scrollToPayStatus">去支付</view>
			</view>
		</view>

		<view v-if="payPanelVisible" class="pay-mask" @tap="closePayTypePanel"></view>
		<view class="pay-panel" :class="{ show: payPanelVisible }">
			<view class="pay-panel-title">选择支付方式</view>
			<view class="pay-panel-option" data-pay-type="balance" @tap="confirmPalmPay">
				<view class="pay-option-icon balance-icon">￥</view>
				<view class="pay-option-main">
					<view class="pay-option-name">余额支付</view>
					<view class="pay-option-desc">使用账户余额结算</view>
				</view>
				<view class="pay-option-arrow">›</view>
			</view>
			<view class="pay-panel-option" data-pay-type="sqb" @tap="confirmPalmPay">
				<view class="pay-option-icon wx-icon">微</view>
				<view class="pay-option-main">
					<view class="pay-option-name">微信支付</view>
					<view class="pay-option-desc">拉起微信收银台支付</view>
				</view>
				<view class="pay-option-arrow">›</view>
			</view>
			<view class="pay-panel-cancel" @tap="closePayTypePanel">取消</view>
		</view>
	</view>
</template>

<script>
import { mapGetters } from 'vuex';
import { getWorkOrderItemList, sqbPrecreate } from '@/api/user.js';

export default {
	data() {
		return {
			workOrderId: '',
			orderStatus: '',
			orderAmount: '',
			loading: false,
			orderSnapshot: {},
			detailInfo: {},
			serviceItemList: [],
			chargeItemList: [],
			otherItemList: [],
			imageItemList: [],
			payingOrderKey: '',
			payPanelVisible: false,
			activeImageType: 0,
			scrollIntoViewId: ''
		};
	},
	computed: {
		...mapGetters(['userInfo', 'isLogin', 'uid']),
		hasContent() {
			return this.hasBasicInfo || this.hasCustomerInfo || this.serviceItemList.length || this.chargeItemList.length || this.otherItemList.length || this.imageItemList.length;
		},
		hasBasicInfo() {
			return !!this.plateText || this.basicInfoRows.length > 0;
		},
		hasCustomerInfo() {
			return this.customerInfoRows.some(row => row.rawValue !== '');
		},
		plateText() {
			return this.formatValue(this.getOrderField([
				'carNumber',
				'plateNo',
				'vehicleNo',
				'carNo',
				'licensePlate'
			]));
		},
		basicStatusText() {
			const sourceText = this.formatValue(this.getOrderField(['statusName', 'statusText', 'workOrderStatusText']));
			if (sourceText === '完工' || sourceText === '待结算') return '待支付';
			if (sourceText === '已结算') return '已支付';
			if (sourceText) return sourceText;
			const statusMap = {
				1: '待支付',
				2: '已支付'
			};
			return statusMap[Number(this.orderStatus)] || '';
		},
		basicInfoRows() {
			const rows = [
				{ label: '总金额', value: this.formatAmountText(this.getBasicAmount()) },
				{ label: '总处数', value: `${this.getTotalQty()}处` },
				{ label: '漆类别', value: this.getPaintCategory() },
				{ label: '预约店', value: this.getOrderField(['tenantName']) },
				{ label: '下单时间', value: this.formatTime(this.getOrderField(['createTime'])) },
				{ label: '到店时间', value: this.formatTime(this.getOrderField(['arrivalTime', 'arriveTime', 'inShopTime', 'appointmentTime'])) },
				{ label: '服务顾问', value: this.getOrderField(['serviceAdvisorName']) },
				{ label: '备注', value: this.getOrderField(['note']) },
				{ label: '订单编号', value: this.getOrderNo(), copyable: true }
			];
			return rows
				.map(row => {
					const rawValue = this.formatBasicValue(row.value);
					return Object.assign({}, row, {
						rawValue,
						value: rawValue
					});
				})
				.filter(row => row.value !== '');
		},
		customerInfoRows() {
			const rows = [
				{ label: '客户称呼', value: this.getOrderField(['customerName']) },
				{ label: '车型名称', value: this.getOrderField(['vehicleModel']) },
				{ label: '车辆颜色', value: this.getOrderField(['vehicleColor']) },
				{ label: '购车年份', value: this.getOrderField(['purchaseYear', 'buyYear', 'carYear', 'vehicleYear']) },
				{ label: 'VIN码', value: this.getOrderField(['vinCode']), copyable: true }
			];
			return rows.map(row => {
				const rawValue = this.formatBasicValue(row.value);
				return Object.assign({}, row, {
					rawValue,
					value: rawValue || '-'
				});
			});
		},
		displayItemList() {
			const serviceList = this.serviceItemList.map(item => Object.assign({ type: 'service' }, item));
			const chargeList = this.chargeItemList.map(item => Object.assign({ type: 'charge' }, item));
			const otherList = this.otherItemList.map(item => Object.assign({ type: 'other' }, item));
			return serviceList.concat(chargeList, otherList);
		},
		serviceDetailList() {
			return this.serviceItemList.map(item => Object.assign({
				type: 'service'
			}, item));
		},
		imageTypeTabs() {
			const labels = ['接车图', '施工前图', '施工中图', '施工后图', '签名图', '支付凭证图', '交车图'];
			return labels.map((label, index) => {
				const type = index + 1;
				return {
					type,
					label,
					text: `${type} ${label}`,
					hasImages: this.imageGroupList.some(group => group.type === type)
				};
			});
		},
		imageGroupList() {
			const typeMap = {
				1: '接车图',
				2: '施工前图',
				3: '施工中图',
				4: '施工后图',
				5: '签名图',
				6: '支付凭证图',
				7: '交车图'
			};
			return Object.keys(typeMap).map(type => {
				const typeNumber = Number(type);
				const items = this.imageItemList
					.filter(item => Number(this.pickValue(item, ['imageType'])) === typeNumber)
					.map(item => Object.assign({}, item, {
						imageUrl: this.formatValue(this.pickValue(item, ['imageUrl']))
					}))
					.filter(item => item.imageUrl)
					.sort((first, second) => this.toSortNumber(first) - this.toSortNumber(second));
				return {
					type: typeNumber,
					label: typeMap[typeNumber],
					items
				};
			}).filter(group => group.items.length);
		},
		summaryRows() {
			const chargeRows = this.chargeItemList.map((item, index) => ({
				label: this.getChargeName(item, index),
				value: this.formatMoneyText(this.pickValue(item, ['amount']))
			}));
			return [
				{ label: '应付金额', value: this.formatMoneyText(this.getPayableAmount()) },
				{ label: '实付金额', value: this.formatMoneyText(this.getPaidAmount()), className: 'paid' },
				...chargeRows,
				{
					label: '支付状态',
					value: this.getPayStatusText(),
					className: this.isPaid() ? 'success' : 'warning',
					actionText: this.isPaid() ? '' : '支付'
				}
			];
		}
	},
	onLoad(options) {
		this.workOrderId = String((options && options.workOrderId) || '').trim();
		this.orderStatus = String((options && options.status) || '').trim();
		this.orderAmount = String((options && options.amount) || '').trim();
		this.orderSnapshot = uni.getStorageSync(`palmOrderSnapshot_${this.workOrderId}`) || {};
		this.fetchDetail();
	},
	methods: {
		extractList(data) {
			if (Array.isArray(data)) return data;
			if (Array.isArray(data && data.data)) return data.data;
			if (Array.isArray(data && data.list)) return data.list;
			if (Array.isArray(data && data.rows)) return data.rows;
			if (Array.isArray(data && data.items)) return data.items;
			return [];
		},
		findNestedList(data, keys) {
			const visited = [];
			const matchKeys = keys.map(key => String(key).toLowerCase());
			const walk = value => {
				if (!value || typeof value !== 'object' || visited.indexOf(value) !== -1) return [];
				visited.push(value);
				if (Array.isArray(value)) return value;
				const objectKeys = Object.keys(value);
				for (let i = 0; i < objectKeys.length; i++) {
					const key = objectKeys[i];
					if (matchKeys.indexOf(String(key).toLowerCase()) !== -1) {
						const list = this.extractList(value[key]);
						if (list.length) return list;
					}
				}
				for (let i = 0; i < objectKeys.length; i++) {
					const list = walk(value[objectKeys[i]]);
					if (list.length) return list;
				}
				return [];
			};
			return walk(data);
		},
		normalizeResponse(result) {
			const responseData = result && Object.prototype.hasOwnProperty.call(result, 'data') ? result.data : result;
			const source = responseData && responseData.data && typeof responseData.data === 'object' ? responseData.data : responseData;
			const serviceSource = source && (
				source.serviceItemList ||
				source.ServiceItemList ||
				source.workOrderServiceItemList ||
				source.serviceList ||
				source.serviceItems
			);
			const serviceItemList = this.extractList(serviceSource).length
				? this.extractList(serviceSource)
				: this.findNestedList(source, [
				'serviceItemList',
				'ServiceItemList',
				'workOrderServiceItemList',
				'serviceList',
				'serviceItems'
			]);
			return {
				detailInfo: source && typeof source === 'object' ? source : {},
				serviceItemList: serviceItemList,
				chargeItemList: this.extractList(
					(source && (source.chargeItemList || source.workOrderChargeItemList || source.chargeList)) || []
				),
				otherItemList: this.extractList(
					(source && (source.itemList || source.detailList || source.workOrderItemList || source.list || source.items)) || []
				),
				imageItemList: this.extractList(
					(source && (source.imageList || source.ImageList || source.workOrderImageList || source.images)) || []
				)
			};
		},
		async fetchDetail() {
			if (!this.workOrderId) {
				uni.showToast({
					title: '缺少工单ID',
					icon: 'none'
				});
				return;
			}
			this.loading = true;
			try {
				const res = await getWorkOrderItemList(this.workOrderId);
				uni.setStorageSync('latestWorkOrderItemListResult', res);
				const detail = this.normalizeResponse(res);
				uni.setStorageSync('latestWorkOrderItemListNormalized', detail);
				console.log('workOrderItemList detail:', {
					rawServiceItemListLength: res && res.data && Array.isArray(res.data.serviceItemList) ? res.data.serviceItemList.length : 0,
					normalizedServiceItemListLength: detail.serviceItemList.length,
					detail
				});
				this.detailInfo = detail.detailInfo;
				this.serviceItemList = detail.serviceItemList;
				this.chargeItemList = detail.chargeItemList;
				this.otherItemList = detail.otherItemList;
				this.imageItemList = detail.imageItemList;
				this.syncActiveImageType();
			} catch (error) {
				this.detailInfo = {};
				this.serviceItemList = [];
				this.chargeItemList = [];
				this.otherItemList = [];
				this.imageItemList = [];
				this.activeImageType = 0;
				uni.showToast({
					title: typeof error === 'string' ? error : '详情加载失败',
					icon: 'none'
				});
			} finally {
				this.loading = false;
			}
		},
		formatValue(value) {
			if (value === '' || value === null || value === undefined) return '';
			return String(value);
		},
		formatBasicValue(value) {
			const text = this.formatValue(value).trim();
			return text || '';
		},
		formatTime(value) {
			const text = this.formatBasicValue(value);
			return text ? text.replace('T', ' ').slice(0, 19) : '';
		},
		formatAmountText(value) {
			const text = this.formatBasicValue(value);
			return text ? `${this.formatMoney(text)}元` : '';
		},
		copyText(event) {
			const text = event && event.currentTarget && event.currentTarget.dataset
				? event.currentTarget.dataset.text
				: '';
			if (!text) return;
			const copyText = String(text);
			const onSuccess = () => {
				uni.showToast({
					title: '复制成功',
					icon: 'none'
				});
			};
			const onFail = error => {
				console.log('copy failed:', error);
				uni.showToast({
					title: '复制失败',
					icon: 'none'
				});
			};
			// #ifdef MP-WEIXIN
			if (typeof wx !== 'undefined' && wx.setClipboardData) {
				wx.setClipboardData({
					data: copyText,
					success: onSuccess,
					fail: onFail
				});
				return;
			}
			// #endif
			uni.setClipboardData({
				data: copyText,
				success: onSuccess,
				fail: onFail
			});
		},
		toNumber(value) {
			const number = Number(String(value === undefined || value === null ? '' : value).replace(/,/g, ''));
			return Number.isFinite(number) ? number : 0;
		},
		toSortNumber(item) {
			const sort = Number(this.pickValue(item, ['sort']));
			return Number.isFinite(sort) ? sort : 0;
		},
		syncActiveImageType() {
			if (!this.imageGroupList.length) {
				this.activeImageType = 0;
				return;
			}
			const hasCurrent = this.imageGroupList.some(group => group.type === Number(this.activeImageType));
			if (!hasCurrent) {
				this.activeImageType = this.imageGroupList[0].type;
			}
		},
		setActiveImageType(event) {
			const type = event && event.currentTarget && event.currentTarget.dataset
				? Number(event.currentTarget.dataset.type)
				: 0;
			this.activeImageType = type;
			if (this.imageGroupList.some(group => group.type === type)) {
				this.scrollIntoViewId = '';
				this.$nextTick(() => {
					this.scrollIntoViewId = `image-group-${type}`;
				});
			}
		},
		scrollToPayStatus() {
			this.scrollIntoViewId = '';
			this.$nextTick(() => {
				this.scrollIntoViewId = 'summary-card';
			});
		},
		handleSummaryPay() {
			if (this.payingOrderKey) return;
			if (this.isPaid()) return;
			if (!this.getOrderNo()) {
				uni.showToast({ title: '缺少订单号', icon: 'none' });
				return;
			}
			this.payPanelVisible = true;
		},
		closePayTypePanel() {
			if (this.payingOrderKey) return;
			this.payPanelVisible = false;
		},
		confirmPalmPay(event) {
			const payType = event && event.currentTarget && event.currentTarget.dataset
				? event.currentTarget.dataset.payType
				: 'sqb';
			if (payType === 'balance') {
				uni.showModal({
					title: '余额支付',
					content: '是否确定余额支付？',
					confirmText: '是',
					cancelText: '否',
					success: (res) => {
						this.payPanelVisible = false;
						if (res.confirm) {
							this.handleSqbPay(payType);
						} else {
							this.scrollToPayStatus();
						}
					}
				});
				return;
			}
			this.payPanelVisible = false;
			this.handleSqbPay(payType);
		},
		async handleSqbPay(payType) {
			if (this.payingOrderKey) return;
			if (this.isPaid()) return;
			payType = payType === 'balance' ? 'balance' : 'sqb';
			const openId = await this.ensureCurrentOpenId();
			const payload = this.buildSqbPrecreatePayload(openId, payType);
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
			}
		},
		previewImage(event) {
			const current = event && event.currentTarget && event.currentTarget.dataset
				? event.currentTarget.dataset.url
				: '';
			const urls = this.imageGroupList.reduce((list, group) => {
				return list.concat(group.items.map(item => item.imageUrl));
			}, []);
			if (!current || !urls.length) return;
			uni.previewImage({
				current,
				urls
			});
		},
		formatMoney(value) {
			return this.toNumber(value).toFixed(2);
		},
		formatMoneyText(value) {
			return `¥ ${this.formatMoney(value)}`;
		},
		pickValue(item, keys) {
			item = item || {};
			for (let i = 0; i < keys.length; i++) {
				const value = item[keys[i]];
				if (value !== '' && value !== null && value !== undefined) return value;
			}
			return '';
		},
		getItemName(item, index) {
			item = item || {};
			return this.formatValue(this.pickValue(item, [
				'serviceName',
				'serviceItemName',
				'chargeName',
				'chargeItemName',
				'partName',
				'itemName',
				'name',
				'projectName',
				'goodsName',
				'productName'
			])) || `项目${index + 1}`;
		},
		getChargeName(item, index) {
			return this.formatValue(this.pickValue(item, [
				'chargeName',
				'chargeItemName',
				'name',
				'itemName',
				'projectName'
			])) || `收费项${index + 1}`;
		},
		getItemTags(item, index) {
			item = item || {};
			if (item.type === 'charge') {
				return [this.getItemTag(item), this.getItemName(item, index)].filter(Boolean);
			}
			const tags = [
				this.pickValue(item, ['panelGroup', 'positionName', 'partPositionName', 'typeName', 'categoryName']),
				this.pickValue(item, ['serviceName', 'serviceItemName', 'itemName', 'name', 'projectName']),
				this.pickValue(item, ['paintTypeName', 'brandName', 'paintName', 'qualityName', 'specName'])
			].map(value => this.formatValue(value)).filter(Boolean);
			return tags.length ? tags : [this.getItemName(item, index)];
		},
		getItemTag(item) {
			if (item && item.type === 'charge') return '其他服务';
			return this.formatValue(this.pickValue(item, [
				'panelGroup',
				'positionName',
				'partPositionName',
				'typeName',
				'categoryName'
			])) || '车头';
		},
		getItemPrice(item) {
			return this.formatValue(this.pickValue(item, [
				'amount',
				'actualAmount',
				'totalAmount',
				'totalPrice',
				'price',
				'money',
				'salePrice'
			]));
		},
		getDetailName(item, index) {
			if (item && item.type === 'charge') return this.getItemName(item, index);
			if (item && item.type === 'other') return this.getItemName(item, index);
			return this.getItemTags(item, index).join('/');
		},
		getItemPriceText(item) {
			return this.formatMoney(this.getItemPrice(item));
		},
		getDetailSubText(item) {
			if (!item || item.type === 'charge' || item.type === 'other') return '';
			const paintTypeName = this.formatValue(this.pickValue(item, ['paintTypeName', 'brandName', 'paintName', 'qualityName', 'specName']));
			const qty = this.getItemQty(item);
			return `${paintTypeName || '标准服务'} · ${qty}处`;
		},
		getItemQty(item) {
			return this.formatValue(this.pickValue(item, ['qty', 'quantity', 'num', 'count'])) || '1';
		},
		sumListAmount(list) {
			return list.reduce((total, item) => total + this.toNumber(this.getItemPrice(item)), 0);
		},
		getSummaryField(keys) {
			return this.pickValue(this.detailInfo, keys);
		},
		getOrderField(keys) {
			const detailValue = this.pickValue(this.detailInfo, keys);
			if (detailValue !== '') return detailValue;
			return this.pickValue(this.orderSnapshot, keys);
		},
		getBasicAmount() {
			return this.getOrderField(['totalAmount']);
		},
		getTotalQty() {
			const value = this.getOrderField(['serviceItemCount']);
			if (value !== '') return this.toNumber(value) || value;
			return '';
		},
		getPaintCategory() {
			const value = this.getOrderField(['paintCategory', 'paintCategoryName', 'paintTypeName', 'lacquerType', 'paintName']);
			if (value !== '') return value;
			const firstService = this.serviceItemList.find(item => this.pickValue(item, ['paintTypeName', 'brandName', 'paintName', 'qualityName', 'specName']));
			return firstService ? this.pickValue(firstService, ['paintTypeName', 'brandName', 'paintName', 'qualityName', 'specName']) : '';
		},
		getOrderNo() {
			return this.getOrderField(['workOrderNo', 'orderNo', 'orderId', 'palmOrderNo', 'id']) || this.workOrderId;
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
		getPayOrderAmount() {
			const amount = this.getPaidAmount();
			return amount !== '' ? amount : this.getPayableAmount();
		},
		toCentAmount(value) {
			const amount = Number(String(value === undefined || value === null ? '' : value).replace(/,/g, '').trim());
			if (!Number.isFinite(amount)) return '';
			return String(Math.round(amount * 100));
		},
		buildSqbPrecreatePayload(openId, payType) {
			return {
				workOrderNo: String(this.getOrderNo() || '').trim(),
				total_amount: this.toCentAmount(this.getPayOrderAmount()),
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
		goPaidOrderList() {
			uni.redirectTo({
				url: '/pages/users/palm_order_list/index?status=2'
			});
		},
		formatPayError(error) {
			const message = typeof error === 'string'
				? error
				: String((error && (error.message || error.msg || error.msgtext || error.errMsg)) || '');
			if (message.indexOf('client_sn') !== -1 || message.indexOf('clientSn') !== -1 || message.indexOf('workOrderNo') !== -1) {
				return '订单号不能为空';
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
		getPayableAmount() {
			return this.chargeItemList.reduce((total, item) => {
				return total + this.toNumber(this.pickValue(item, ['amount']));
			}, 0);
		},
		getPaidAmount() {
			if (this.orderAmount !== '') return this.orderAmount;
			const value = this.getSummaryField(['paidAmount', 'actualAmount', 'payAmount', 'realAmount', 'receivedAmount']);
			return value !== '' ? value : 0;
		},
		isPaid() {
			if (Number(this.orderStatus) === 1) return false;
			if (Number(this.orderStatus) === 2) return true;
			const status = this.getSummaryField(['payStatus', 'paid', 'isPaid', 'status']);
			if (status === '') return this.toNumber(this.getPaidAmount()) > 0;
			return Number(status) === 1 || Number(status) === 2 || status === true || String(status).indexOf('已') !== -1;
		},
		getPayStatusText() {
			if (Number(this.orderStatus) === 1) return '待支付';
			if (Number(this.orderStatus) === 2) return '已支付';
			const text = this.getSummaryField(['payStatusText', 'paidStatusText', 'statusText']);
			if (text) return text;
			return this.isPaid() ? '已支付' : '待支付';
		}
	}
};
</script>

<style scoped lang="scss">
.detail-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #eef6ff 0, #f5f8fc 420rpx);
	position: relative;
	overflow: hidden;
}

.detail-scroll {
	position: relative;
	z-index: 3;
	height: 100vh;
	padding: 28rpx 32rpx 44rpx;
	box-sizing: border-box;
}

.detail-scroll.has-image-tabs {
	padding-bottom: 230rpx;
}

.state-card {
	position: relative;
	z-index: 3;
	margin: 24rpx 30rpx 0;
	padding: 80rpx 24rpx;
	border-radius: 16rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	row-gap: 24rpx;
	font-size: 28rpx;
	color: #94a3b8;
	background: #ffffff;
}

.reload-button {
	min-width: 150rpx;
	height: 58rpx;
	padding: 0 24rpx;
	border-radius: 29rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	font-size: 26rpx;
	color: #ffffff;
	background: #e93323;
}

.content-card {
	margin-bottom: 26rpx;
	padding: 0 34rpx 30rpx;
	border-radius: 18rpx;
	background: #ffffff;
	box-shadow: 0 14rpx 34rpx rgba(31, 87, 146, 0.12);
	position: relative;
	overflow: hidden;
}

.basic-card {
	padding-top: 26rpx;
}

.customer-card {
	padding-top: 0;
}

.basic-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 24rpx;
	padding-bottom: 22rpx;
}

.plate-title {
	flex: 1;
	min-width: 0;
	font-size: 34rpx;
	font-weight: 700;
	color: #333333;
	word-break: break-all;
}

.basic-status {
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

.section-title {
	position: relative;
	display: flex;
	align-items: center;
	column-gap: 16rpx;
	padding: 34rpx 0 28rpx;
	border-bottom: 1rpx solid #edf2f7;
	font-size: 30rpx;
	font-weight: 700;
	color: #0f172a;
}

.basic-title {
	padding: 22rpx 0 22rpx;
	column-gap: 0;
	font-size: 28rpx;
	color: #333333;
}

.section-bar {
	width: 8rpx;
	height: 38rpx;
	border-radius: 999rpx;
	background: #1f7aff;
}

.basic-list {
	padding-top: 14rpx;
}

.basic-row {
	min-height: 70rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 24rpx;
}

.summary-list {
	padding: 28rpx 0 0;
}

.summary-row {
	min-height: 78rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	column-gap: 24rpx;
}

.summary-left {
	display: flex;
	align-items: center;
	min-width: 0;
}

.info-label {
	font-size: 28rpx;
	color: #263347;
}

.info-value {
	flex-shrink: 0;
	font-size: 30rpx;
	color: #16243a;
	text-align: right;
}

.basic-value {
	max-width: 450rpx;
	word-break: break-all;
}

.customer-value-wrap {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	column-gap: 18rpx;
}

.copy-button {
	flex-shrink: 0;
	min-width: 72rpx;
	height: 44rpx;
	padding: 0 14rpx;
	border: 1rpx solid #1f7aff;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	font-size: 24rpx;
	color: #1f7aff;
	background: #ffffff;
}

.info-value.paid {
	font-size: 34rpx;
	color: #ff3b3f;
}

.info-value.warning {
	font-size: 30rpx;
	color: #f59e0b;
}

.info-value.success {
	color: #009966;
}

.summary-action-wrap {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	column-gap: 16rpx;
	min-width: 220rpx;
}

.summary-pay-button {
	flex-shrink: 0;
	height: 52rpx;
	padding: 0 22rpx;
	border: 2rpx solid #1f7cff;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	font-size: 26rpx;
	font-weight: 700;
	color: #1f7cff;
	background: #ffffff;
}

.summary-row:last-child {
	margin-top: 20rpx;
	padding-top: 28rpx;
	border-top: 1rpx solid #edf2f7;
}

.detail-list {
	padding-top: 18rpx;
}

.detail-empty {
	padding: 26rpx 0 8rpx;
	font-size: 26rpx;
	color: #94a3b8;
	text-align: center;
}

.detail-item-row {
	min-height: 104rpx;
	display: flex;
	align-items: center;
	border-bottom: 1rpx dashed #dce5f1;
}

.detail-item-row:last-child {
	border-bottom: none;
}

.detail-name {
	display: block;
	flex: 1;
	min-width: 0;
	font-size: 27rpx;
	font-weight: 700;
	color: #0f172a;
	word-break: break-all;
}

.detail-main {
	flex: 1;
	min-width: 0;
}

.detail-sub {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #66758a;
}

.detail-right {
	flex-shrink: 0;
	min-width: 160rpx;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	row-gap: 8rpx;
}

.detail-price {
	font-size: 27rpx;
	color: #126cf2;
	font-weight: 500;
}

.detail-count {
	font-size: 24rpx;
	color: #16243a;
}

.image-type-fixed {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 20;
	padding: 20rpx 30rpx calc(22rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	background: #ffffff;
	box-shadow: 0 -10rpx 28rpx rgba(15, 35, 66, 0.08);
}

.image-type-tabs {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 18rpx 20rpx;
}

.image-type-tab {
	min-width: 132rpx;
	height: 58rpx;
	padding: 0 22rpx;
	border-radius: 29rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	font-size: 26rpx;
	color: #333333;
	background: #f1f1f1;
}

.image-type-tab.active {
	color: #ffffff;
	background: #20c761;
}

.image-pay-tab {
	font-weight: 700;
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

.image-group-list {
	padding-top: 24rpx;
}

.image-group {
	margin-bottom: 30rpx;
}

.image-group:last-child {
	margin-bottom: 0;
}

.image-group-title {
	margin-bottom: 18rpx;
	font-size: 27rpx;
	font-weight: 700;
	color: #16243a;
}

.image-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 16rpx;
}

.order-image {
	width: 100%;
	height: 150rpx;
	border-radius: 8rpx;
	background: #eef2f7;
}

@media screen and (max-width: 360px) {
	.detail-right {
		min-width: 130rpx;
	}

	.detail-price {
		font-size: 28rpx;
	}

}

.info-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	text-align: right;
}

</style>
