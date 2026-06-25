<template>
	<view class="detail-page">
		<view
			class="nav-shell"
			:style="{
				paddingTop: statusBarHeight + 'px',
				height: navTotalHeight + 'px'
			}"
		>
			<view class="nav-row" :style="{ height: navContentHeight + 'px' }">
				<view class="nav-back" @click="handleBack">
					<view class="nav-back-line nav-back-line-top"></view>
					<view class="nav-back-line nav-back-line-bottom"></view>
				</view>
				<text class="nav-title">询价订单</text>
			</view>
		</view>

		<view class="mode-tabs">
			<view class="mode-tab" :class="{ active: activeMode === 'part' }" @click="setActiveMode('part')">按配件</view>
			<view class="mode-tab" :class="{ active: activeMode === 'merchant' }" @click="setActiveMode('merchant')">按商家</view>
			<view v-if="hasFeaturedMode" class="mode-tab" :class="{ active: activeMode === 'featured' }" @click="setActiveMode('featured')">巧手严选</view>
		</view>

		<view class="summary-card">
			<view class="summary-icon">
				<image
					class="summary-icon-image"
					src="https://xpb.cn-shenzhen.oss.aliyuncs.com/235235/pt20260618162608619363573586.jpg?versionId=CAEQdBiBgMCK7Kzn9hkiIDE4OTBlYTJjODFiNDQxNTViNmQxZjY5NGFhMWMxMjRm"
					mode="aspectFill"
				/>
			</view>
			<view class="summary-main">
				<text class="summary-title">{{ orderInfo.vehicleName }}</text>
				<view class="summary-line">
					<text class="summary-label">VIN码：</text>
					<text>{{ orderInfo.vinCode || '--' }}</text>
					<text v-if="orderInfo.vinCode" class="copy-text" @click="copyValue(orderInfo.vinCode)">复制</text>
				</view>
				<view class="summary-line">
					<text class="summary-label">询价单：</text>
					<text>{{ orderInfo.inquiryNo || '--' }}</text>
					<text v-if="orderInfo.inquiryNo" class="copy-text" @click="copyValue(orderInfo.inquiryNo)">复制</text>
				</view>
				<view class="summary-line">
					<text class="summary-label">平台询价单号：</text>
					<text>{{ orderInfo.platformNo || '--' }}</text>
					<text v-if="orderInfo.platformNo" class="copy-text" @click="copyValue(orderInfo.platformNo)">复制</text>
				</view>
				<view class="summary-line">
					<text class="summary-label">状态：</text>
					<text class="status-badge">{{ orderInfo.statusText }}</text>
				</view>
			</view>
		</view>

		<view v-if="loading" class="state-box">
			<view class="state-text">加载中...</view>
		</view>

		<template v-else-if="parts.length">
			<view class="filter-row">
				<view class="filter-item filter-sort" @click="openFilterSheet('sort')">
					<text>{{ sortOptions[sortIndex] }}</text>
					<text class="filter-arrow">▼</text>
				</view>
				<view class="filter-item filter-quality" @click="openFilterSheet('quality')">
					<text>{{ selectedQualityFilterText }}</text>
					<text class="filter-arrow">▼</text>
				</view>
				<view class="filter-item filter-supplier" @click="openFilterSheet('supplier')">
					<text>{{ selectedSupplierFilterText }}</text>
					<text class="filter-arrow">▼</text>
				</view>
			</view>

			<view v-if="activeMode !== 'merchant'" class="detail-body">
				<scroll-view scroll-y class="parts-column">
					<view
						v-for="(part, index) in filteredParts"
						:key="part.key"
						class="part-nav-item"
						:class="{ active: activePartIndex === index }"
						@click="handlePartChange(index)"
					>
						<view class="quoted-count">{{ part.quoteCount }}家已报价</view>
						<view class="part-nav-name">{{ part.name }}</view>
					</view>
				</scroll-view>

				<scroll-view scroll-y class="quote-column">
					<view class="part-head-card">
						<view class="part-head-top">
							<text class="part-head-title">{{ currentPart.name }}</text>
							<text v-if="currentPart.sku" class="part-head-sku">| {{ currentPart.sku }}</text>
							<view v-if="currentPart.sku" class="epc-btn">EPC</view>
						</view>
						<view class="part-head-bottom">
							<text>推荐数量：{{ currentPart.recommendCount }}</text>
							<view class="quantity-box">
								<text class="quantity-label">购买数量:</text>
								<view class="quantity-stepper">
									<text class="quantity-minus" @click.stop="changeQuantity(currentPart.key, -1)">-</text>
									<text class="quantity-value">{{ currentPart.buyCount }}</text>
									<text class="quantity-plus" @click.stop="changeQuantity(currentPart.key, 1)">+</text>
								</view>
							</view>
						</view>
					</view>

					<view
						v-for="quote in currentPart.quotes"
						:key="quote.id"
						class="quote-card"
						:class="{
							selected: isQuoteSelected(currentPart.key, quote.id),
							'quote-card-featured': isQiaoshouQuote(quote)
						}"
						@click="selectQuote(currentPart.key, quote)"
					>
						<view v-if="isQiaoshouQuote(quote)" class="featured-banner">
							<text class="featured-banner-title">巧手严选</text>
							<text class="featured-banner-slogan">品质好 服务优 省心买</text>
						</view>
						<view class="quote-card-head">
							<text class="quote-brand">{{ quote.brandText }}</text>
							<view class="quote-select" :class="{ selected: isQuoteSelected(currentPart.key, quote.id) }">
								<view v-if="isQuoteSelected(currentPart.key, quote.id)" class="quote-select-inner"></view>
							</view>
						</view>
						<view class="quote-price">￥{{ quote.price }}</view>
						<view class="quote-total">总价 ￥{{ quote.totalPrice }}</view>
						<view class="quote-line">{{ quote.stockText }}</view>
						<view v-if="quote.venderSellerName" class="quote-line quote-seller-line">
							<text>{{ quote.venderSellerName }}</text>
							<text v-if="isQiaoshouQuote(quote) && quote.score" class="seller-score-chip">评分 {{ quote.score }}</text>
						</view>
						<view v-if="quote.oeCode" class="quote-line">{{ quote.oeCode }}</view>
							<view v-if="getVisibleQuoteTags(quote).length" class="tag-row">
								<text v-for="tag in getVisibleQuoteTags(quote)" :key="tag" class="tag-chip">{{ tag }}</text>
							</view>
							<view v-if="quote.serviceTags.length" class="service-tag-row">
								<text v-for="tag in quote.serviceTags" :key="tag" class="service-tag-chip">{{ tag }}</text>
							</view>
							<view v-if="quote.remark" class="remark-box">{{ quote.remark }}</view>
						</view>
				</scroll-view>
			</view>

			<view v-else class="merchant-mode">
				<scroll-view scroll-y class="merchant-scroll">
					<view v-for="group in visibleMerchantGroups" :key="group.key" class="merchant-group-block">
						<view v-if="group.name" class="merchant-current-bar">
							<view class="merchant-current-line"></view>
							<text class="merchant-current-name">{{ group.name }}</text>
							<text v-if="isMerchantGroupOpen(group)" class="merchant-current-status">今日营业</text>
						</view>
						<view v-for="section in getMerchantSections(group)" :key="section.key" class="merchant-part-card">
							<view class="merchant-part-card-head">
								<view class="merchant-part-main">
									<text class="merchant-part-title">{{ section.partName }}</text>
									<text v-if="section.sku" class="merchant-part-sku">OE: {{ section.sku }}</text>
									<text class="merchant-part-recommend">推荐数量: {{ section.recommendCount }}</text>
								</view>
								<view class="merchant-part-qty">
									<text class="merchant-qty-label">购买数量:</text>
									<view class="quantity-stepper merchant-stepper">
										<text class="quantity-minus" @click.stop="changeQuantity(section.partKey, -1)">-</text>
										<text class="quantity-value">{{ section.buyCount }}</text>
										<text class="quantity-plus" @click.stop="changeQuantity(section.partKey, 1)">+</text>
									</view>
								</view>
							</view>
							<view
								v-for="quote in section.items"
								:key="quote.id"
								class="merchant-quote-card"
								@click="selectQuote(section.partKey, quote)"
							>
								<view class="merchant-quote-row merchant-quote-row-top">
									<view class="merchant-quote-brand-wrap">
										<view class="quote-select merchant-quote-select" :class="{ selected: isQuoteSelected(section.partKey, quote.id) }">
											<view v-if="isQuoteSelected(section.partKey, quote.id)" class="quote-select-inner"></view>
										</view>
										<text class="merchant-quote-brand">{{ quote.brandText }}</text>
									</view>
									<view class="merchant-quote-price-wrap">
										<text class="merchant-quote-price">￥{{ quote.price }}</text>
										<text class="merchant-quote-total">总价 ￥{{ quote.totalPrice }}</text>
									</view>
								</view>
								<view v-if="getVisibleQuoteTags(quote).length" class="merchant-tag-row">
									<text v-for="tag in getVisibleQuoteTags(quote)" :key="tag" class="merchant-tag-chip">{{ tag }}</text>
								</view>
								<view v-if="quote.serviceTags && quote.serviceTags.length" class="merchant-tag-row merchant-service-tag-row">
									<text v-for="tag in quote.serviceTags" :key="tag" class="merchant-tag-chip merchant-service-tag-chip">{{ tag }}</text>
								</view>
								<view class="merchant-quote-meta">
									<text>{{ quote.venderSellerName || group.name }}</text>
									<text v-if="quote.score" class="seller-score-chip">评分 {{ quote.score }}</text>
								</view>
								<view class="merchant-quote-code">{{ quote.oeCode }}</view>
								<view v-if="quote.remark" class="merchant-remark-box">{{ quote.remark }}</view>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>
		</template>

		<view v-else class="state-box">
			<view class="state-text">暂无报价数据</view>
			<view class="state-action" @click="fetchDetail">重新加载</view>
		</view>

		<view class="bottom-bar">
			<view class="bottom-left">
				<text class="selected-text">已选 {{ selectedPartCount }}/{{ filteredParts.length }} 种配件</text>
				<text class="total-price">￥{{ selectedTotalPrice }}</text>
				<text class="discount-text">暂无可用优惠</text>
			</view>
			<view class="bottom-actions">
				<view class="secondary-btn" @click="handleAppendInquiry">追加询价</view>
				<view class="primary-btn" @click="handlePlaceOrder">下单</view>
			</view>
		</view>
		<view v-if="activeFilterSheet" class="filter-sheet-mask" @click="cancelFilterSheet">
			<view class="filter-sheet" @click.stop>
				<view class="filter-sheet-actions">
					<text class="filter-sheet-action filter-sheet-cancel" @click="cancelFilterSheet">取消</text>
					<text class="filter-sheet-action filter-sheet-confirm" @click="confirmFilterSheet">完成</text>
				</view>
				<scroll-view scroll-y class="filter-sheet-options" :style="{ height: filterSheetHeight }">
					<view
						v-for="option in activeFilterSheetOptions"
						:key="option.value"
						class="filter-sheet-option"
						:class="{ active: option.value === pendingFilterValue }"
						@click="pickFilterSheetOption(option.value)"
					>
						{{ option.label }}
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
const DEFAULT_ORDER_INFO = {
	vehicleName: '车型信息',
	vinCode: '',
	inquiryNo: '',
	platformNo: '',
	statusText: '待报价'
};

const STATUS_TEXT_MAP = {
	1: '待报价',
	2: '已报价',
	3: '已过期',
	4: '译码失败',
	6: '已下单'
};

const PRODUCT_SERVICE_TAG_MAP = {
	ZHIBAO_1M: '质保1个月',
	ZHIBAO_3M: '质保3个月',
	ZHIBAO_6M: '质保6个月',
	ZHIBAO_12M: '质保12个月',
	ZHIBAO_18M: '质保18个月',
	ZHIBAO_24M: '质保24个月',
	ZHIBAO_36M: '质保36个月',
	COMPENSATION_3TIME: '假一赔三',
	COMPENSATION_10TIME: '假一赔十',
	RETURN_WITHOUT_REASON_7D: '7天无理由退货',
	WULIUWUYOU: '物流货损无忧',
	FANXIUPEI_50: '返修赔50',
	FANXIUPEI_100: '返修赔100',
	FANXIUPEI_200: '返修赔200',
	FANXIUPEI_300: '返修赔300',
	BAOZHUANGCHE: '保装车',
	BAOJIAOCHE: '保交车',
	CASSYANXUAN: '巧手严选',
	JISHUZHICHI: '平台技术支持',
	ZHUANGCHESUPEI: '装车速赔服务'
};

const BRAND_QUALITY_TYPE_MAP = {
	'1': '原厂(国内4S)',
	'2': '原厂(非国内4S)',
	'3': '品牌件',
	'4': '原厂再制造',
	'5': '工厂件',
	'6': '拆车件',
	'7': '同质件',
	'8': '其他'
};

const ALL_QUALITY_FILTER = '\u5168\u90E8\u54C1\u8D28';
const ALL_SUPPLIER_FILTER = '\u4F9B\u5E94\u5546';

export default {
	data() {
		return {
			statusBarHeight: 20,
			navContentHeight: 44,
			windowWidth: 375,
			activeMode: 'part',
			activePartIndex: 0,
			activeMerchantIndex: 0,
			loading: false,
			showSortOptions: false,
			showQualityOptions: false,
			showSupplierOptions: false,
			sortIndex: 0,
			activeFilterSheet: '',
			pendingFilterValue: '',
			filterSheetHeight: '260px',
			selectedQualityFilter: ALL_QUALITY_FILTER,
			selectedSupplierFilter: ALL_SUPPLIER_FILTER,
			sortOptions: ['综合排序', '价格从低到高', '价格从高到低'],
			autoRefreshTimer: null,
			placingOrder: false,
			routeParams: {
				id: '',
				externalInquiryId: '',
				vinCode: '',
				vehicleName: ''
				},
				orderInfo: { ...DEFAULT_ORDER_INFO },
				parts: [],
				selectedQuotes: {},
				productServiceTagMap: {},
				supplierStoreInfoMap: {}
			};
		},
	computed: {
		navTotalHeight() {
			return this.statusBarHeight + this.navContentHeight;
		},
		currentPart() {
			const part = this.filteredParts[this.activePartIndex] || {
				key: '',
				name: '',
				sku: '',
				recommendCount: 0,
				buyCount: 1,
				quotes: []
			};
			return {
				...part,
				quotes: this.getSortedQuotes(this.getFilteredQuotes(part.quotes || []))
			};
		},
		filteredParts() {
			return this.parts
				.map(part => {
					const filteredQuotes = this.getFilteredQuotes(part.quotes || []);
					return {
						...part,
						quotes: filteredQuotes,
						quoteCount: this.getSupplierQuoteCount(filteredQuotes)
					};
				})
				.filter(part => part.quoteCount > 0);
		},
		hasFeaturedMode() {
			return this.parts.some(part =>
				(part.quotes || []).some(quote => this.isQiaoshouQuote(quote))
			);
		},
		currentPartQualityOptions() {
			const qualityList = Array.from(
				new Set(
					this.parts
						.flatMap(part => part.quotes || [])
						.map(quote => quote.qualityText || '')
						.filter(Boolean)
				)
			);
			return [ALL_QUALITY_FILTER].concat(qualityList);
		},
		selectedQualityFilterText() {
			return this.selectedQualityFilter || ALL_QUALITY_FILTER;
		},
		currentSupplierOptions() {
			const supplierList = Array.from(
				new Set(
					this.parts
						.flatMap(part => part.quotes || [])
						.map(quote => this.getQuoteSupplierName(quote))
						.filter(Boolean)
				)
			);
			return [ALL_SUPPLIER_FILTER].concat(supplierList);
		},
		selectedSupplierFilterText() {
			return this.selectedSupplierFilter || ALL_SUPPLIER_FILTER;
		},
		activeFilterSheetOptions() {
			if (this.activeFilterSheet === 'sort') {
				return this.sortOptions.map((label, index) => ({
					label,
					value: String(index)
				}));
			}
			if (this.activeFilterSheet === 'quality') {
				return this.currentPartQualityOptions.map(item => ({
					label: item,
					value: item
				}));
			}
			if (this.activeFilterSheet === 'supplier') {
				return this.currentSupplierOptions.map(item => ({
					label: item,
					value: item
				}));
			}
			return [];
		},
		currentRawPart() {
			const activePart = this.filteredParts[this.activePartIndex];
			if (activePart && activePart.key) {
				return this.parts.find(part => part.key === activePart.key) || activePart;
			}
			return this.parts[0] || null;
		},
		merchantGroups() {
			const merchantMap = {};
			this.filteredParts.forEach(part => {
				part.quotes.forEach(quote => {
					const supplierName = this.getQuoteSupplierName(quote) || quote.merchantName || `merchant-${quote.id}`;
					const key = supplierName;
					if (!merchantMap[key]) {
						merchantMap[key] = {
							key,
							name: supplierName,
							score: quote.score,
							items: []
						};
					}
					merchantMap[key].items.push({
						...quote,
						partKey: part.key,
						partName: part.name,
						sku: part.sku,
						recommendCount: part.recommendCount,
						buyCount: part.buyCount
					});
				});
			});
			return Object.values(merchantMap);
		},
		selectedMerchantGroup() {
			return this.merchantGroups[this.activeMerchantIndex] || this.merchantGroups[0] || {
				key: '',
				name: '',
				items: []
			};
		},
		selectedMerchantSections() {
			const group = this.selectedMerchantGroup;
			return this.getMerchantSections(group);
		},
		visibleMerchantGroups() {
			if (!this.selectedSupplierFilter || this.selectedSupplierFilter === ALL_SUPPLIER_FILTER) {
				return this.merchantGroups;
			}
			return this.selectedMerchantGroup && this.selectedMerchantGroup.key ? [this.selectedMerchantGroup] : [];
		},
		selectedMerchantIsOpen() {
			return this.isMerchantGroupOpen(this.selectedMerchantGroup);
		},
		selectedPartCount() {
			return Object.keys(this.selectedQuotes).length;
		},
		selectedTotalPrice() {
			const total = Object.values(this.selectedQuotes).reduce((sum, item) => {
				const price = Number(item.totalPrice || item.price || 0);
				return sum + (Number.isNaN(price) ? 0 : price);
			}, 0);
			return total.toFixed(2);
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
			this.windowWidth = Number(info.windowWidth || 375) || 375;
			const windowHeight = Number(info.windowHeight || 0);
			if (windowHeight > 0) {
				this.filterSheetHeight = `${Math.max(Math.round(windowHeight * 0.32), 180)}px`;
			}
			this.routeParams = {
				id: this.safeDecode(options.id),
				externalInquiryId: this.safeDecode(options.externalInquiryId),
				vinCode: this.safeDecode(options.vinCode),
				vehicleName: this.safeDecode(options.vehicleName)
			};
			this.initOrderInfoFromCache();
			this.fetchProductServiceTags();
			this.fetchDetail();
			this.startAutoRefresh();
		},
	onShow() {
		this.startAutoRefresh();
	},
	onHide() {
		this.stopAutoRefresh();
	},
	onUnload() {
		this.stopAutoRefresh();
	},
	methods: {
		handleBack() {
			uni.navigateBack({ delta: 1 });
		},
		setActiveMode(mode) {
			if (mode === 'featured' && !this.hasFeaturedMode) {
				this.activeMode = 'part';
				return;
			}
			this.activeMode = mode;
			this.activePartIndex = 0;
			this.activeMerchantIndex = 0;
			this.showQualityOptions = false;
			this.showSortOptions = false;
			this.showSupplierOptions = false;
			this.syncSupplierFilter();
		},
		handleMerchantTabChange(index) {
			this.activeMerchantIndex = index;
		},
		getMerchantSections(group) {
			const sectionMap = {};
			(((group && group.items) || [])).forEach(quote => {
				const key = quote.partKey || `${quote.partName}-${quote.oeCode || quote.id}`;
				if (!sectionMap[key]) {
					sectionMap[key] = {
						key,
						partKey: quote.partKey,
						partName: quote.partName,
						sku: quote.sku || quote.oeCode || '',
						recommendCount: quote.recommendCount || 1,
						buyCount: quote.buyCount || 1,
						items: []
					};
				}
				sectionMap[key].items.push(quote);
			});
			return Object.values(sectionMap);
		},
		isMerchantGroupOpen(group) {
			return (((group && group.items) || [])).some(quote =>
				Array.isArray(quote.serviceTags) && quote.serviceTags.includes('今日营业')
			);
		},
		openFilterSheet(type) {
			this.showSortOptions = false;
			this.showQualityOptions = false;
			this.showSupplierOptions = false;
			this.activeFilterSheet = type;
			this.updateFilterSheetHeight(type);
			if (type === 'sort') {
				this.pendingFilterValue = String(this.sortIndex);
				return;
			}
			if (type === 'quality') {
				this.pendingFilterValue = this.selectedQualityFilter || ALL_QUALITY_FILTER;
				return;
			}
			if (type === 'supplier') {
				this.pendingFilterValue = this.selectedSupplierFilter || ALL_SUPPLIER_FILTER;
				return;
			}
			this.pendingFilterValue = '';
		},
		cancelFilterSheet() {
			this.activeFilterSheet = '';
			this.pendingFilterValue = '';
		},
		updateFilterSheetHeight() {
			const info = uni.getSystemInfoSync ? (uni.getSystemInfoSync() || {}) : {};
			const windowHeight = Number(info.windowHeight || 0);
			const windowWidth = Number(info.windowWidth || this.windowWidth || 375) || 375;
			const rowHeight = Math.round((104 * windowWidth) / 750);
			const visibleRowCount = 3;
			const fixedHeight = rowHeight * visibleRowCount;
			const maxHeight = windowHeight > 0 ? Math.max(Math.round(windowHeight * 0.32), fixedHeight) : fixedHeight;
			this.filterSheetHeight = `${Math.min(fixedHeight, maxHeight)}px`;
		},
		pickFilterSheetOption(value) {
			this.pendingFilterValue = value;
		},
		confirmFilterSheet() {
			if (this.activeFilterSheet === 'sort') {
				this.selectSort(Number(this.pendingFilterValue || 0));
			} else if (this.activeFilterSheet === 'quality') {
				this.selectQualityFilter(this.pendingFilterValue || ALL_QUALITY_FILTER);
			} else if (this.activeFilterSheet === 'supplier') {
				this.selectSupplierFilter(this.pendingFilterValue || ALL_SUPPLIER_FILTER);
			}
			this.cancelFilterSheet();
		},
		handlePartChange(index) {
			this.activePartIndex = index;
			this.showQualityOptions = false;
			this.showSortOptions = false;
			this.showSupplierOptions = false;
			this.syncSupplierFilter();
		},
		startAutoRefresh() {
			this.stopAutoRefresh();
			this.autoRefreshTimer = setInterval(() => {
				this.fetchDetail();
			}, 15000);
		},
		stopAutoRefresh() {
			if (!this.autoRefreshTimer) return;
			clearInterval(this.autoRefreshTimer);
			this.autoRefreshTimer = null;
		},
		toggleSortOptions() {
			this.showQualityOptions = false;
			this.showSupplierOptions = false;
			this.showSortOptions = !this.showSortOptions;
		},
		toggleQualityOptions() {
			this.showSortOptions = false;
			this.showSupplierOptions = false;
			this.showQualityOptions = !this.showQualityOptions;
		},
		toggleSupplierOptions() {
			this.showSortOptions = false;
			this.showQualityOptions = false;
			this.showSupplierOptions = !this.showSupplierOptions;
		},
		selectSort(index) {
			this.sortIndex = index;
			this.showSortOptions = false;
		},
		selectQualityFilter(quality) {
			this.selectedQualityFilter = quality || ALL_QUALITY_FILTER;
			this.showQualityOptions = false;
			if (this.activePartIndex >= this.filteredParts.length) {
				this.activePartIndex = 0;
			}
			if (this.activeMerchantIndex >= this.merchantGroups.length) {
				this.activeMerchantIndex = 0;
			}
			this.syncSupplierFilter();
		},
		selectSupplierFilter(supplier) {
			this.selectedSupplierFilter = supplier || ALL_SUPPLIER_FILTER;
			this.showSupplierOptions = false;
			if (this.activePartIndex >= this.filteredParts.length) {
				this.activePartIndex = 0;
			}
			if (this.activeMerchantIndex >= this.merchantGroups.length) {
				this.activeMerchantIndex = 0;
			}
		},
		syncSupplierFilter() {
			if (this.selectedSupplierFilter === ALL_SUPPLIER_FILTER) return;
			if (this.currentSupplierOptions.includes(this.selectedSupplierFilter)) return;
			this.selectedSupplierFilter = ALL_SUPPLIER_FILTER;
		},
		getFilteredQuotes(quotes) {
			const list = Array.isArray(quotes) ? [...quotes] : [];
			return list.filter(quote => {
				const featuredMatched = this.activeMode !== 'featured'
					? true
					: this.isQiaoshouQuote(quote);
				const qualityMatched = !this.selectedQualityFilter || this.selectedQualityFilter === ALL_QUALITY_FILTER
					? true
					: quote.qualityText === this.selectedQualityFilter;
				const supplierMatched = !this.selectedSupplierFilter || this.selectedSupplierFilter === ALL_SUPPLIER_FILTER
					? true
					: this.getQuoteSupplierName(quote) === this.selectedSupplierFilter;
				return featuredMatched && qualityMatched && supplierMatched;
			});
		},
		getQuoteSupplierName(quote) {
			if (!quote || typeof quote !== 'object') return '';
			return String(quote.venderSellerName || quote.merchantName || '').trim();
		},
		getQuoteSupplierKey(quote) {
			if (!quote || typeof quote !== 'object') return '';
			const id = String(quote.venderSellerId || '').trim();
			if (id) return `id:${id}`;
			const name = this.getQuoteSupplierName(quote);
			if (name) return `name:${name}`;
			return `quote:${quote.id || ''}`;
		},
		getSupplierQuoteCount(quotes) {
			if (!Array.isArray(quotes)) return 0;
			return new Set(
				quotes
					.map(quote => this.getQuoteSupplierKey(quote))
					.filter(Boolean)
			).size;
		},
		isQiaoshouQuote(quote) {
			const serviceTagIds = Array.isArray(quote && quote.serviceTagIds)
				? quote.serviceTagIds.map(item => String(item || '').trim()).filter(Boolean)
				: [];
			return serviceTagIds.includes('CASSYANXUAN');
		},
		getVisibleQuoteTags(quote) {
			return Array.isArray(quote && quote.tags) ? quote.tags : [];
		},
		getSortedQuotes(quotes) {
			const list = Array.isArray(quotes) ? [...quotes] : [];
			if (this.sortIndex === 1) {
				return list.sort((a, b) => Number(a.totalPrice || a.price || 0) - Number(b.totalPrice || b.price || 0));
			}
			if (this.sortIndex === 2) {
				return list.sort((a, b) => Number(b.totalPrice || b.price || 0) - Number(a.totalPrice || a.price || 0));
			}
			return list;
		},
		safeDecode(value) {
			if (!value) return '';
			try {
				return decodeURIComponent(value);
			} catch (error) {
				return value;
			}
		},
		initOrderInfoFromCache() {
			const cache = uni.getStorageSync('inquiryOrderHistoryCurrent') || {};
			this.orderInfo = {
				...DEFAULT_ORDER_INFO,
				vehicleName: this.routeParams.vehicleName || cache.carModelName || cache.vehicleName || DEFAULT_ORDER_INFO.vehicleName,
				vinCode: this.routeParams.vinCode || cache.vin || cache.vinCode || '',
				inquiryNo: this.routeParams.externalInquiryId || cache.externalInquiryId || '',
				platformNo: cache.thirdContractId || cache.quotationNo || cache.platformInquiryId || cache.platformNo || '',
				statusText: this.getStatusText(cache.requestStatus)
			};
		},
		getStatusText(status) {
			return STATUS_TEXT_MAP[Number(status)] || DEFAULT_ORDER_INFO.statusText;
		},
		getDetailRequestPayload() {
			const getters = (this.$store && this.$store.getters) || {};
			const cache = uni.getStorageSync('inquiryOrderHistoryCurrent') || {};
			const payload = {
				pagesize: 200,
				pageno: 1,
				userId: Number(getters.uid || 0) || 0,
				mobile: (cache.mobile || (getters.userInfo && getters.userInfo.phone) || '').trim(),
				quotationNo: cache.quotationNo || cache.platformInquiryId || cache.platformNo || this.routeParams.externalInquiryId || undefined,
				supplyCode: cache.supplyCode || ''
			};
			Object.keys(payload).forEach(key => {
				if (payload[key] === undefined || payload[key] === null) {
					delete payload[key];
				}
			});
			return payload;
		},
		requestDetailList(payload) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/Quotation/GetList',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: payload,
					success: res => resolve((res && res.data) || {}),
					fail: reject
				});
			});
		},
		requestSupplierStoreInfo(storeIds) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/GetSupplierStoreInfo',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: {
						storeIds
					},
					success: res => resolve((res && res.data) || {}),
					fail: reject
				});
			});
		},
		requestCreateOrder(payload) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/CreateOrder',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: payload,
					success: res => resolve((res && res.data) || {}),
					fail: reject
				});
			});
		},
		requestUserOpenId(uid) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: `${HTTP_REQUEST_URL}/api/front/user/openid?uid=${encodeURIComponent(uid)}`,
					method: 'GET',
					success: res => resolve((res && res.data) || {}),
					fail: reject
				});
			});
		},
		extractOpenIdFromResponse(result) {
			if (!result) return '';
			if (typeof result === 'string') return result.trim();
			if (typeof result !== 'object') return '';
			if (result.data !== undefined && result.data !== null) {
				if (typeof result.data === 'string') {
					return result.data.trim();
				}
				if (typeof result.data === 'object') {
					return this.pickValue(result.data, ['openId', 'openid'], '');
				}
			}
			return this.pickValue(result, ['openId', 'openid'], '');
		},
		cacheCurrentOpenId(openId) {
			const normalizedOpenId = String(openId || '').trim();
			if (!normalizedOpenId) return;
			const getters = (this.$store && this.$store.getters) || {};
			const storeUserInfo = getters.userInfo || {};
			const cachedUserInfo = uni.getStorageSync('USER_INFO') || {};
			const nextUserInfo = {
				...cachedUserInfo,
				...storeUserInfo,
				openId: normalizedOpenId
			};
			uni.setStorageSync('USER_INFO', nextUserInfo);
			if (this.$store && this.$store.commit) {
				this.$store.commit('UPDATE_USERINFO', {
					...storeUserInfo,
					openId: normalizedOpenId
				});
			}
		},
		async ensureCurrentOpenId() {
			return this.getCurrentOpenId();
		},
		getCreateOrderPayConfig(result) {
			const data = (result && result.data) || {};
			const wxJsapiPay = data.wxJsapiPay || {};
			return {
				appId: String(wxJsapiPay.appId || wxJsapiPay.appid || ''),
				timeStamp: String(wxJsapiPay.timeStamp || ''),
				nonceStr: String(wxJsapiPay.nonceStr || ''),
				package: String(wxJsapiPay.package || ''),
				signType: String(wxJsapiPay.signType || 'RSA'),
				paySign: String(wxJsapiPay.paySign || '')
			};
		},
		hasCreateOrderPayConfig(payConfig) {
			return !!(
				payConfig &&
				payConfig.timeStamp &&
				payConfig.nonceStr &&
				payConfig.package &&
				payConfig.paySign
			);
		},
		redirectAfterPayment(status) {
			uni.redirectTo({
				url: `/pages/users/inquiry_order_list/index?payStatus=${encodeURIComponent(status || '')}`
			});
		},
		requestCreateOrderPayment(payConfig) {
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
		async startCreateOrderPayment(result) {
			const payConfig = this.getCreateOrderPayConfig(result);
			uni.setStorageSync('latestMiniCreateOrderPayConfig', payConfig);
			if (!this.hasCreateOrderPayConfig(payConfig)) {
				uni.showToast({
					title: '下单成功，缺少支付参数',
					icon: 'none'
				});
				setTimeout(() => {
					this.redirectAfterPayment('created');
				}, 300);
				return;
			}
			try {
				await this.requestCreateOrderPayment(payConfig);
				uni.showToast({
					title: '支付成功',
					icon: 'success'
				});
				setTimeout(() => {
					this.redirectAfterPayment('success');
				}, 300);
			} catch (error) {
				const errMsg = (error && error.errMsg) || '';
				if (errMsg.indexOf('cancel') !== -1) {
					uni.showToast({
						title: '已取消支付',
						icon: 'none'
					});
					setTimeout(() => {
						this.redirectAfterPayment('cancel');
					}, 300);
					return;
				}
				uni.showToast({
					title: '支付失败，请稍后重试',
					icon: 'none'
				});
				setTimeout(() => {
					this.redirectAfterPayment('fail');
				}, 300);
			}
		},
			requestProductServiceTags() {
				return Promise.resolve({
					msgid: 200,
					msgtext: '',
					data: Object.keys(PRODUCT_SERVICE_TAG_MAP).map(value => ({
						key: PRODUCT_SERVICE_TAG_MAP[value],
						value
					})),
					total: 0
				});
			},
		extractList(data) {
			if (Array.isArray(data)) return data;
			if (!data || typeof data !== 'object') return [];
			if (Array.isArray(data.list)) return data.list;
			if (Array.isArray(data.rows)) return data.rows;
			if (Array.isArray(data.items)) return data.items;
			if (Array.isArray(data.data)) return data.data;
			return [];
		},
		parseArrayValue(value) {
			if (!value) return [];
			if (Array.isArray(value)) return value.filter(Boolean);
			if (typeof value === 'string') {
				try {
					const parsed = JSON.parse(value);
					if (Array.isArray(parsed)) return parsed.filter(Boolean);
				} catch (error) {
					return value
						.split(/[，,|;；]/)
						.map(item => item.trim())
						.filter(Boolean);
				}
			}
			return [];
		},
		parseJsonObject(value) {
			if (value && typeof value === 'object' && !Array.isArray(value)) return value;
			if (!value || typeof value !== 'string') return {};
			try {
				const parsed = JSON.parse(value);
				return parsed && typeof parsed === 'object' ? parsed : {};
			} catch (error) {
				return {};
			}
		},
		parseIdList(value) {
			if (!value) return [];
			if (Array.isArray(value)) {
				return value
					.map(item => String(item).trim())
					.filter(Boolean);
			}
			if (typeof value === 'number') {
				return [String(value)];
			}
			if (typeof value === 'string') {
				try {
					const parsed = JSON.parse(value);
					if (Array.isArray(parsed)) {
						return parsed
							.map(item => String(item).trim())
							.filter(Boolean);
					}
				} catch (error) {
					// ignore parse error
				}
				return value
					.split(/[,\uff0c|;|\s]+/)
					.map(item => item.trim())
					.filter(Boolean);
			}
			return [];
		},
		pickValue(source, keys, fallback = '') {
			for (let index = 0; index < keys.length; index += 1) {
				const value = source ? source[keys[index]] : '';
				if (value !== undefined && value !== null && value !== '') {
					return value;
				}
			}
			return fallback;
		},
		formatMoney(value) {
			const numberValue = Number(value);
			if (Number.isNaN(numberValue)) {
				return value || '0.00';
			}
			return numberValue.toFixed(2);
		},
		formatTime(value) {
			if (!value) return '';
			return String(value).replace('T', ' ').slice(0, 19);
		},
		getSelectedQuoteList() {
			return Object.values(this.selectedQuotes || {}).filter(item => item && typeof item === 'object');
		},
		getCurrentOpenId() {
			const getters = (this.$store && this.$store.getters) || {};
			const storeUserInfo = getters.userInfo || {};
			const cachedUserInfo = uni.getStorageSync('USER_INFO') || {};
			return this.pickValue(
				storeUserInfo,
				['openId', 'openid'],
				this.pickValue(cachedUserInfo, ['openId', 'openid'], '')
			);
		},
		buildCreateOrderPayload(openId = '') {
			const getters = (this.$store && this.$store.getters) || {};
			const userInfo = getters.userInfo || {};
			return {
				userId: Number(getters.uid || 0) || 0,
				mobile: userInfo.phone || '',
				userName: userInfo.nickname || userInfo.realName || '',
				externalInquiryId: this.orderInfo.inquiryNo || this.routeParams.externalInquiryId || '',
				orderProducts: this.getSelectedQuoteList().map(item => ({
					thirdUuid: item.thirdUuid || this.pickValue(item.raw, ['thirdUuid'], ''),
					productNumber: Number(item.buyCount || 1) || 1
				})),
				remark: '',
				useWxJsapiPay: true,
				openId: String(openId || this.getCurrentOpenId() || '').trim()
			};
		},
		buildBrandText(item) {
			const texts = [
				this.pickValue(item, ['brandText', 'brandName', 'partsBrandName', 'oeBrandName']),
				this.pickValue(item, ['qualityText', 'qualityName', 'qualityLevelName', 'sourceText'])
			].filter(Boolean);
			return texts.join(' | ') || '报价信息';
		},
			getBrandQualityTypeText(value) {
				const key = value === undefined || value === null ? '' : String(value).trim();
				return BRAND_QUALITY_TYPE_MAP[key] || key;
			},
			getVehicleBrandText() {
				const vehicleName = (this.orderInfo && this.orderInfo.vehicleName) || '';
				return String(vehicleName).trim().split(/\s+/)[0] || '';
			},
			normalizeQuoteBrandText(item, qualityText) {
				const rawBrandText = this.pickValue(
					item,
					['thirdBrandName', 'brandfacturerName', 'brandText', 'brandName', 'partsBrandName', 'oeBrandName'],
					''
				);
				const brandText = String(rawBrandText || '').trim();
				const vehicleBrandText = this.getVehicleBrandText();
				if (!brandText) {
					return vehicleBrandText;
				}
				if (qualityText && brandText === qualityText) {
					return vehicleBrandText || brandText;
				}
				if (Object.values(BRAND_QUALITY_TYPE_MAP).includes(brandText)) {
					return vehicleBrandText || brandText;
				}
				return brandText;
			},
			buildStockText(item) {
			return this.pickValue(
				item,
				['stockText', 'warehouseName', 'stockName', 'stockAddress', 'deliveryAddress', 'address'],
				'库存信息待补充'
			);
		},
				normalizeKeyValueList(list) {
					if (!Array.isArray(list)) return {};
					return list.reduce((map, item) => {
						const label = item && item.key != null ? String(item.key).trim() : '';
						const value = item && item.value != null ? String(item.value).trim() : '';
						if (label && value) {
							map[value] = label;
						}
						return map;
					}, {});
				},
			getServiceTagsByIds(ids) {
				if (!Array.isArray(ids) || !ids.length) return [];
				return ids
					.map(id => this.productServiceTagMap[String(id).trim()] || '')
					.filter(Boolean);
			},
			getSupplierBusinessStatusTag(venderSellerId) {
				const key = venderSellerId === undefined || venderSellerId === null ? '' : String(venderSellerId).trim();
				if (!key) return '';
				const storeInfo = this.supplierStoreInfoMap[key];
				if (!storeInfo || typeof storeInfo.todayIsWeekday !== 'boolean') return '';
				return storeInfo.todayIsWeekday ? '今日营业' : '今日停业';
			},
			buildQuoteServiceTags(serviceTagIds, venderSellerId) {
				const tags = this.getServiceTagsByIds(serviceTagIds);
				const businessStatusTag = this.getSupplierBusinessStatusTag(venderSellerId);
				if (businessStatusTag && !tags.includes(businessStatusTag)) {
					tags.push(businessStatusTag);
				}
				return tags;
			},
			extractSupplierStoreIds(list) {
				if (!Array.isArray(list) || !list.length) return [];
				return Array.from(
					new Set(
						list
							.map(item => {
								const extend = this.parseJsonObject(item && item.extend);
								return this.pickValue(extend, ['venderSellerId'], this.pickValue(item, ['venderSellerId', 'storeId'], ''));
							})
							.map(id => String(id || '').trim())
							.filter(Boolean)
					)
				);
			},
			normalizeSupplierStoreInfoMap(list) {
				if (!Array.isArray(list)) return {};
				return list.reduce((map, item) => {
					const key = item && item.storeId != null ? String(item.storeId).trim() : '';
					if (key) {
						map[key] = item;
					}
					return map;
				}, {});
			},
			async fetchSupplierStoreInfoMapByList(list) {
				const storeIds = this.extractSupplierStoreIds(list);
				if (!storeIds.length) {
					this.supplierStoreInfoMap = {};
					return;
				}
				try {
					const result = await this.requestSupplierStoreInfo(storeIds);
					if (!result || Number(result.msgid) !== 200) {
						this.supplierStoreInfoMap = {};
						return;
					}
					this.supplierStoreInfoMap = this.normalizeSupplierStoreInfoMap(result.data);
					if (this.parts.length) {
						this.refreshQuoteServiceTags();
					}
				} catch (error) {
					this.supplierStoreInfoMap = {};
				}
			},
			refreshQuoteServiceTags() {
				this.parts = this.parts.map(part => ({
					...part,
					quotes: (part.quotes || []).map(quote => ({
						...quote,
						serviceTags: this.buildQuoteServiceTags(quote.serviceTagIds || [], quote.venderSellerId)
					}))
				}));
			},
			async fetchProductServiceTags() {
				try {
					const result = await this.requestProductServiceTags();
					if (!result || Number(result.msgid) !== 200) return;
					this.productServiceTagMap = this.normalizeKeyValueList(result.data);
					if (this.parts.length) {
						this.refreshQuoteServiceTags();
					}
				} catch (error) {
					// ignore tag load failures
				}
			},
			normalizeOrderInfo(list, result) {
			const cache = uni.getStorageSync('inquiryOrderHistoryCurrent') || {};
			const source = list[0] || (result && result.data) || cache || {};
			return {
				vehicleName: this.pickValue(source, ['carModelName', 'vehicleName', 'modelName'], this.routeParams.vehicleName || DEFAULT_ORDER_INFO.vehicleName),
				vinCode: this.pickValue(source, ['vin', 'vinCode'], this.routeParams.vinCode),
				inquiryNo: this.pickValue(source, ['externalInquiryId', 'inquiryNo', 'quotationRequestNo', 'quotationNo'], this.routeParams.externalInquiryId),
				platformNo: this.pickValue(source, ['thirdContractId', 'quotationNo', 'platformInquiryId', 'platformNo', 'platformOrderNo']),
				statusText: this.getStatusText(this.pickValue(source, ['requestStatus', 'status'], 1)),
				updateTime: this.formatTime(this.pickValue(source, ['opTime', 'createTime', 'updateTime']))
			};
		},
		normalizeQuoteItem(item, partName, buyCount, index) {
			const extend = this.parseJsonObject(item.extend);
			const priceValue = this.pickValue(item, ['price', 'unitPrice', 'quotePrice', 'salePrice', 'offerPrice'], 0);
				const totalValue = this.pickValue(item, ['totalPrice', 'amount', 'quoteAmount'], Number(priceValue || 0) * Number(buyCount || 1));
				const serviceTagIds = this.parseIdList(
					extend.productServiceTagIdList ||
					this.pickValue(item, ['productServiceTagIdList'])
				);
			const merchantName = this.pickValue(item, ['merchantName', 'supplierName', 'shopName', 'storeName', 'brandfacturerName'], '供应商');
				const venderSellerName = this.pickValue(
					extend,
					['venderSellerName'],
					this.pickValue(item, ['venderSellerName', 'sellerName'], '')
				);
				const venderSellerId = this.pickValue(
					extend,
					['venderSellerId'],
					this.pickValue(item, ['venderSellerId', 'storeId'], '')
				);
				const qualityText = this.getBrandQualityTypeText(
					this.pickValue(item, ['brandQualityType', 'qualityText', 'qualityName', 'qualityLevelName', 'sourceText'])
				);
				const tagSource =
					extend.serviceTagNames ||
					extend.serviceTags ||
					extend.tagNames ||
				extend.labels ||
				this.pickValue(item, ['tags', 'tagList', 'labelNames', 'serviceTags']);
			return {
				id: this.pickValue(item, ['id', 'quotationId', 'quoteId'], `${partName}-${merchantName}-${index}`),
				thirdUuid: this.pickValue(item, ['thirdUuid']),
				partName,
				buyCount: Number(buyCount || 1) || 1,
					brandText: this.normalizeQuoteBrandText(item, qualityText) +
						(qualityText ? ` | ${qualityText}` : ''),
					qualityText,
					price: this.formatMoney(priceValue),
				totalPrice: this.formatMoney(totalValue),
				stockText: this.pickValue(item, ['supplyWarehouseName', 'stockText', 'warehouseName', 'stockName', 'stockAddress', 'deliveryAddress', 'address'], '库存信息待补充'),
				merchantName,
				venderSellerName,
				venderSellerId: venderSellerId ? String(venderSellerId).trim() : '',
				score: this.pickValue(item, ['score', 'supplierScore', 'merchantScore'], ''),
					oeCode: this.pickValue(item, ['oeCode', 'oeNo', 'partsCode', 'code']),
					serviceTagIds,
					serviceTags: this.buildQuoteServiceTags(serviceTagIds, venderSellerId),
					tags: this.parseArrayValue(tagSource),
				remark: this.pickValue(item, ['remark', 'quoteRemark', 'message']),
				raw: item
			};
		},
		normalizeParts(list) {
			const cache = uni.getStorageSync('inquiryOrderHistoryCurrent') || {};
			const needs = this.parseArrayValue(cache.userNeeds).map(item => (item && typeof item === 'object' ? item : {}));
			const needMap = needs.reduce((map, need, index) => {
				const key = need.needsId || `${index + 1}`;
				map[key] = need;
				return map;
			}, {});
			const partMap = {};
			list.forEach((item, index) => {
				const need = needMap[item.partNo] || {};
				const name = this.pickValue(need, ['needsName', 'oeName', 'stdName'], this.pickValue(item, ['needsName', 'oeName', 'stdName', 'partsName', 'partName', 'goodsName'], `配件${index + 1}`));
				const sku = this.pickValue(need, ['oeCode', 'stdNameCode'], this.pickValue(item, ['oeCode', 'partsCode', 'oeNo', 'sku', 'code']));
				const recommendCount = Number(this.pickValue(need, ['quantity'], this.pickValue(item, ['suggestNum', 'recommendCount', 'count', 'qty', 'num', 'purchaseCount', 'partsNum'], 1))) || 1;
				const key = `${name}__${sku || index}`;
				if (!partMap[key]) {
					partMap[key] = {
						key,
						name,
						sku,
						recommendCount,
						buyCount: recommendCount,
						quotes: []
					};
				}
				partMap[key].quotes.push(this.normalizeQuoteItem(item, name, partMap[key].buyCount, index));
			});
			return Object.values(partMap).map(part => ({
				...part,
				quoteCount: this.getSupplierQuoteCount(part.quotes)
			}));
		},
		async fetchDetail() {
			this.loading = true;
			try {
				const result = await this.requestDetailList(this.getDetailRequestPayload());
				if (!result || Number(result.msgid) !== 200) {
					throw new Error((result && result.msgtext) || '加载失败');
				}
				const list = this.extractList(result.data);
				await this.fetchSupplierStoreInfoMapByList(list);
				this.orderInfo = this.normalizeOrderInfo(list, result);
				this.parts = this.normalizeParts(list);
				if (this.activePartIndex >= this.filteredParts.length) {
					this.activePartIndex = 0;
				}
				if (this.activeMerchantIndex >= this.merchantGroups.length) {
					this.activeMerchantIndex = 0;
				}
				if (this.activeMode === 'featured' && !this.hasFeaturedMode) {
					this.activeMode = 'part';
				}
				this.syncSupplierFilter();
			} catch (error) {
				this.parts = [];
				if (this.activeMode === 'featured') {
					this.activeMode = 'part';
				}
				uni.showToast({
					title: error.message || '加载失败，请稍后重试',
					icon: 'none'
				});
			} finally {
				this.loading = false;
			}
		},
		copyValue(value) {
			if (!value) return;
			uni.setClipboardData({
				data: String(value),
				success: () => {
					uni.showToast({
						title: '复制成功',
						icon: 'success'
					});
				}
			});
		},
		handleAppendInquiry() {
			const historyCache = uni.getStorageSync('inquiryOrderHistoryCurrent') || {};
			const vehicleInfo = {
				...historyCache,
				carModelName: this.orderInfo.vehicleName || historyCache.carModelName || historyCache.vehicleName || '',
				saleModelName: this.orderInfo.vehicleName || historyCache.saleModelName || '',
				vin: this.orderInfo.vinCode || historyCache.vin || '',
				vinCode: this.orderInfo.vinCode || historyCache.vinCode || ''
			};
			uni.setStorageSync('inquiryVehicleInfo', vehicleInfo);
			uni.setStorageSync('inquiryAppendContext', {
				orderInfo: this.orderInfo,
				historyCache,
				parts: this.parts
			});
			uni.navigateTo({
				url: `/pages/users/inquiry_parts/index?vehicleName=${encodeURIComponent(this.orderInfo.vehicleName || '')}&vin=${encodeURIComponent(this.orderInfo.vinCode || '')}&externalInquiryId=${encodeURIComponent(this.orderInfo.inquiryNo || historyCache.externalInquiryId || '')}`
			});
		},
		async handlePlaceOrder() {
			if (this.placingOrder) return;
			const selectedQuoteList = this.getSelectedQuoteList();
			if (!selectedQuoteList.length) {
				uni.showToast({
					title: '请选择要下单的报价',
					icon: 'none'
				});
				return;
			}
			if (!(this.orderInfo.inquiryNo || this.routeParams.externalInquiryId)) {
				uni.showToast({
					title: '缺少询价单号',
					icon: 'none'
				});
				return;
			}
			const missingUuid = selectedQuoteList.find(item => !(item.thirdUuid || this.pickValue(item.raw, ['thirdUuid'], '')));
			if (missingUuid) {
				uni.showToast({
					title: '存在无法下单的报价信息',
					icon: 'none'
				});
				return;
			}

			const openId = await this.ensureCurrentOpenId();
			const payload = this.buildCreateOrderPayload(openId);
			if (!payload.openId) {
				uni.showToast({
					title: '未获取到openId，请重新登录后再试',
					icon: 'none'
				});
				return;
			}
			this.placingOrder = true;
			uni.setStorageSync('latestMiniCreateOrderRequestBody', payload);
			uni.showLoading({
				title: '下单中',
				mask: true
			});
			try {
				const result = await this.requestCreateOrder(payload);
				if (!result || Number(result.msgid) !== 200) {
					uni.showToast({
						title: (result && result.msgtext) || '下单失败',
						icon: 'none'
					});
					return;
				}
				uni.setStorageSync('latestMiniCreateOrderResult', result.data || {});
				uni.showToast({
					title: '下单成功',
					icon: 'success'
				});
				await this.startCreateOrderPayment(result);
			} catch (error) {
				uni.showToast({
					title: '下单失败，请稍后重试',
					icon: 'none'
				});
			} finally {
				this.placingOrder = false;
				uni.hideLoading();
			}
		},
		changeQuantity(partKey, delta) {
			const partIndex = this.parts.findIndex(item => item.key === partKey);
			if (partIndex === -1) return;
			const current = this.parts[partIndex];
			const nextCount = Math.max(1, Number(current.buyCount || 1) + delta);
			const nextPart = {
				...current,
				buyCount: nextCount,
				quotes: current.quotes.map(quote => ({
					...quote,
					buyCount: nextCount,
					totalPrice: this.formatMoney(Number(quote.price || 0) * nextCount)
				}))
			};
			this.$set(this.parts, partIndex, nextPart);
			const selected = this.selectedQuotes[partKey];
			if (selected) {
				const nextSelected = nextPart.quotes.find(item => item.id === selected.id);
				if (nextSelected) {
					this.$set(this.selectedQuotes, partKey, nextSelected);
				}
			}
		},
		isQuoteSelected(partKey, quoteId) {
			return this.selectedQuotes[partKey] && this.selectedQuotes[partKey].id === quoteId;
		},
		selectQuote(partKey, quote) {
			if (this.isQuoteSelected(partKey, quote.id)) {
				this.$delete(this.selectedQuotes, partKey);
				return;
			}
			this.$set(this.selectedQuotes, partKey, quote);
		}
	}
};
</script>

<style scoped lang="scss">
.detail-page { height: 100vh; background: #f4f5f8; display: flex; flex-direction: column; overflow: hidden; }
.nav-shell { flex-shrink: 0; background: #303030; }
.nav-row { position: relative; display: flex; align-items: center; justify-content: center; padding: 0 36rpx; }
.nav-back { position: absolute; left: 22rpx; top: 50%; width: 60rpx; height: 60rpx; transform: translateY(-50%); }
.nav-back-line { position: absolute; left: 16rpx; width: 4rpx; height: 30rpx; border-radius: 999rpx; background: #ffffff; transform-origin: center; }
.nav-back-line-top { top: 10rpx; transform: rotate(45deg); }
.nav-back-line-bottom { top: 28rpx; transform: rotate(-45deg); }
.nav-title { font-size: 36rpx; font-weight: 500; color: #ffffff; }
.mode-tabs { display: flex; align-items: center; background: #ffffff; border-bottom: 1rpx solid #eceff3; }
.mode-tab { position: relative; padding: 24rpx 36rpx 20rpx; font-size: 34rpx; font-weight: 700; color: #1e232b; }
.mode-tab.active { color: #10151c; }
.mode-tab.active::after { content: ''; position: absolute; left: 36rpx; right: 36rpx; bottom: 0; height: 4rpx; border-radius: 999rpx; background: #e0212d; }
.summary-card { display: flex; align-items: center; padding: 18rpx 22rpx; background: #ffffff; }
.summary-icon { width: 88rpx; height: 88rpx; margin-right: 18rpx; border-radius: 18rpx; overflow: hidden; flex-shrink: 0; background: #eef4ff; display: flex; align-items: center; justify-content: center; }
.summary-icon-image { width: 100%; height: 100%; display: block; }
.summary-main { flex: 1; min-width: 0; }
.summary-title { display: block; font-size: 32rpx; font-weight: 700; line-height: 1.35; color: #1f252d; }
.summary-line { display: flex; align-items: center; flex-wrap: wrap; margin-top: 8rpx; font-size: 24rpx; color: #505762; }
.summary-label { color: #5a626e; }
.copy-text { margin-left: 14rpx; color: #3e9af1; }
.status-badge { padding: 6rpx 14rpx; border-radius: 10rpx; color: #14a264; background: #eefbf4; }
.state-box { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #9fa6af; }
.state-text { font-size: 28rpx; }
.state-action { margin-top: 24rpx; padding: 16rpx 34rpx; border-radius: 999rpx; color: #1679f3; background: #eef5ff; font-size: 28rpx; }
.filter-row { display: flex; align-items: center; justify-content: space-between; padding: 18rpx 24rpx; background: #ffffff; border-top: 1rpx solid #edf0f4; border-bottom: 1rpx solid #edf0f4; }
.filter-item { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; font-size: 27rpx; color: #262c35; }
.filter-sort { position: relative; display: flex; align-items: center; justify-content: flex-start; }
.filter-quality { position: relative; display: flex; align-items: center; justify-content: center; }
.filter-supplier { justify-content: flex-end; }
.filter-arrow { margin-left: 8rpx; font-size: 20rpx; color: #7a828d; }
.sort-dropdown { position: absolute; left: 0; top: 44rpx; z-index: 20; min-width: 220rpx; padding: 10rpx 0; border-radius: 16rpx; background: #ffffff; box-shadow: 0 12rpx 36rpx rgba(23, 35, 61, 0.12); }
.quality-dropdown { left: 50%; min-width: 240rpx; transform: translateX(-50%); }
.supplier-dropdown { right: 0; left: auto; min-width: 260rpx; }
.sort-option { padding: 18rpx 24rpx; font-size: 26rpx; color: #2a313b; white-space: nowrap; }
.sort-option.active { color: #1679f3; background: #eef5ff; }
.filter-sheet-mask { position: fixed; left: 0; top: 0; right: 0; bottom: 0; z-index: 99; background: rgba(0, 0, 0, 0.42); display: flex; align-items: flex-end; }
.filter-sheet { width: 100%; padding-bottom: env(safe-area-inset-bottom); background: #ffffff; border-radius: 28rpx 28rpx 0 0; overflow: hidden; }
.filter-sheet-actions { height: 108rpx; display: flex; align-items: center; justify-content: space-between; padding: 0 40rpx; border-bottom: 1rpx solid #eceff3; }
.filter-sheet-action { font-size: 32rpx; line-height: 1; }
.filter-sheet-cancel { color: #8a9099; }
.filter-sheet-confirm { color: #1679f3; font-weight: 600; }
.filter-sheet-options { height: 260px; }
.filter-sheet-option { min-height: 104rpx; display: flex; align-items: center; justify-content: center; padding: 0 36rpx; font-size: 34rpx; color: #2b313b; border-bottom: 1rpx solid #f1f3f6; text-align: center; word-break: break-all; }
.filter-sheet-option.active { color: #111827; font-weight: 700; background: #f8fafc; }
.detail-body { flex: 1; min-height: 0; display: flex; }
.parts-column { width: 188rpx; background: #ffffff; }
.part-nav-item { min-height: 150rpx; padding: 14rpx 0; border-bottom: 1rpx solid #edf0f4; }
.part-nav-item.active { background: #ffffff; box-shadow: inset 6rpx 0 0 #e3242d; }
.quoted-count { margin: 0 16rpx; height: 46rpx; border-radius: 8rpx; display: flex; align-items: center; justify-content: center; font-size: 22rpx; color: #ffffff; background: #e71f2d; }
.part-nav-name { margin: 18rpx 18rpx 0; font-size: 28rpx; font-weight: 700; line-height: 1.35; color: #222830; word-break: break-all; }
.quote-column { flex: 1; min-width: 0; padding: 0 16rpx 20rpx; box-sizing: border-box; }
.part-head-card { margin-top: 16rpx; border-radius: 0 0 16rpx 16rpx; overflow: hidden; background: #ffffff; }
.part-head-top { padding: 18rpx 20rpx; display: flex; align-items: center; background: linear-gradient(90deg, #5c4e91 0%, #6978a8 100%); color: #ffffff; }
.part-head-title { font-size: 32rpx; font-weight: 700; color: #ffe45f; }
.part-head-sku { margin-left: 10rpx; font-size: 26rpx; color: #ffffff; }
.epc-btn { margin-left: auto; width: 68rpx; height: 68rpx; border: 2rpx solid rgba(255,255,255,0.7); border-radius: 14rpx; display: flex; align-items: center; justify-content: center; font-size: 24rpx; font-weight: 600; color: #ffffff; }
.part-head-bottom { padding: 18rpx 20rpx; display: flex; align-items: center; justify-content: space-between; font-size: 26rpx; color: #4a5260; background: #ffffff; }
.quantity-box { display: flex; align-items: center; }
.quantity-label { margin-right: 12rpx; }
.quantity-stepper { width: 160rpx; height: 54rpx; border-radius: 27rpx; display: flex; align-items: center; justify-content: space-between; padding: 0 18rpx; background: #f4f6fb; }
.quantity-minus, .quantity-plus, .quantity-value { font-size: 28rpx; font-weight: 600; color: #29303a; }
.quote-card { margin-top: 18rpx; padding: 22rpx 24rpx 20rpx; border-radius: 20rpx; border: 1rpx solid #f3d8dd; background: #ffffff; box-shadow: 0 2rpx 8rpx rgba(183, 46, 63, 0.04); }
.quote-card.selected { border-color: #e45a67; box-shadow: 0 6rpx 16rpx rgba(228, 90, 103, 0.1); }
.quote-card-featured { overflow: hidden; padding-top: 0; border-color: #e35a58; box-shadow: none; }
.quote-card-featured .quote-card-head { margin-top: 18rpx; }
.quote-card-featured .quote-brand { color: #22406f; }
.featured-banner { margin: 0 -24rpx; padding: 14rpx 18rpx 12rpx; display: flex; align-items: center; justify-content: space-between; background: linear-gradient(90deg, #c61e25 0%, #f05a52 100%); }
.featured-banner-title { font-size: 30rpx; font-weight: 700; color: #ffffff; line-height: 1; }
.featured-banner-slogan { margin-left: 16rpx; font-size: 24rpx; font-weight: 600; color: rgba(255, 245, 220, 0.96); line-height: 1.2; text-align: right; }
.quote-card-head { display: flex; align-items: flex-start; justify-content: space-between; }
.quote-brand { flex: 1; min-width: 0; font-size: 31rpx; font-weight: 700; line-height: 1.35; color: #243d72; }
.quote-select { width: 44rpx; height: 44rpx; margin-left: 18rpx; border: 2rpx solid #dde1e8; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; box-sizing: border-box; background: #ffffff; }
.quote-select.selected { border-color: #e45a67; }
.quote-select-inner { width: 22rpx; height: 22rpx; border-radius: 50%; background: #e45a67; }
.quote-price { margin-top: 12rpx; font-size: 36rpx; font-weight: 800; line-height: 1.1; color: #c81b2a; }
.quote-total { margin-top: 8rpx; font-size: 24rpx; font-weight: 600; line-height: 1.3; color: #d94a55; }
.quote-line { margin-top: 10rpx; display: flex; align-items: center; flex-wrap: wrap; font-size: 24rpx; line-height: 1.6; color: #4a4f5a; }
.quote-seller-line { column-gap: 12rpx; }
.seller-score-chip { display: inline-flex; align-items: center; height: 40rpx; padding: 0 12rpx; border-radius: 10rpx; font-size: 22rpx; line-height: 1; color: #bf8a21; background: #fff2c8; border: 1rpx solid #f1d58a; }
.score-tag { margin-left: 14rpx; padding: 4rpx 10rpx; border-radius: 8rpx; font-size: 22rpx; color: #b3821b; background: #fff4cf; }
.tag-row { margin-top: 12rpx; display: flex; align-items: center; flex-wrap: wrap; gap: 10rpx; }
.tag-chip { padding: 6rpx 10rpx; border-radius: 8rpx; font-size: 22rpx; color: #9d4d5d; background: #fff6f8; border: 1rpx solid #efd7dd; }
.remark-box { margin-top: 14rpx; padding: 12rpx 14rpx; border-radius: 8rpx; border: 1rpx solid #efcfd4; font-size: 24rpx; line-height: 1.65; color: #66606c; background: #fffdfd; }
.quote-card-featured .remark-box { background: #fffefe; color: #73707b; }
.service-tag-row { margin-top: 14rpx; display: flex; align-items: center; flex-wrap: wrap; gap: 10rpx; }
.service-tag-chip { padding: 6rpx 12rpx; border-radius: 6rpx; font-size: 22rpx; line-height: 1.35; color: #9c5a67; background: #fffaf9; border: 1rpx solid #efcfd4; }
.merchant-mode { flex: 1; min-height: 0; display: flex; flex-direction: column; background: #f5f7fb; }
.merchant-group-block { margin-bottom: 8rpx; }
.merchant-current-bar { flex-shrink: 0; margin: 14rpx 0 0; padding: 18rpx 22rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: space-between; background: #ffffff; box-shadow: 0 4rpx 12rpx rgba(80, 117, 172, 0.06); }
.merchant-current-line { width: 6rpx; height: 38rpx; border-radius: 999rpx; background: #4ca4ff; }
.merchant-current-name { flex: 1; min-width: 0; margin-left: 14rpx; font-size: 32rpx; font-weight: 700; color: #1f252d; }
.merchant-current-status { margin-left: 18rpx; flex-shrink: 0; padding: 8rpx 16rpx; border-radius: 999rpx; font-size: 24rpx; color: #55a3f2; background: #eef7ff; }
.merchant-scroll { flex: 1; min-height: 0; padding: 16rpx; box-sizing: border-box; }
.merchant-part-card { margin-top: 14rpx; margin-bottom: 18rpx; border-radius: 24rpx; background: #ffffff; box-shadow: 0 8rpx 24rpx rgba(110, 133, 170, 0.08); overflow: hidden; }
.merchant-part-card-head { padding: 24rpx 28rpx; display: flex; align-items: flex-start; justify-content: space-between; column-gap: 16rpx; }
.merchant-part-main { flex: 1; min-width: 0; }
.merchant-part-title { display: block; font-size: 26rpx; font-weight: 700; color: #1f252d; }
.merchant-part-sku { display: block; margin-top: 8rpx; font-size: 24rpx; color: #7b8491; }
.merchant-part-recommend { display: block; margin-top: 10rpx; font-size: 24rpx; color: #758090; }
.merchant-part-qty { flex-shrink: 0; display: flex; align-items: center; }
.merchant-qty-label { margin-right: 12rpx; font-size: 24rpx; color: #758090; }
.merchant-stepper { width: 168rpx; background: #f7f9fd; }
.merchant-quote-card { padding: 22rpx 28rpx 24rpx; border-top: 1rpx solid #edf0f5; }
.merchant-quote-row { display: flex; align-items: flex-start; justify-content: space-between; column-gap: 16rpx; }
.merchant-quote-brand-wrap { flex: 1; min-width: 0; display: flex; align-items: center; }
.merchant-quote-select { margin-left: 0; margin-right: 14rpx; }
.merchant-quote-brand { flex: 1; min-width: 0; font-size: 26rpx; font-weight: 700; line-height: 1.4; color: #1f252d; }
.merchant-quote-price-wrap { flex-shrink: 0; text-align: right; }
.merchant-quote-price { display: block; font-size: 34rpx; font-weight: 800; color: #de412e; line-height: 1.1; }
.merchant-quote-total { display: block; margin-top: 8rpx; font-size: 24rpx; font-weight: 600; color: #de6d5e; }
.merchant-tag-row { margin-top: 16rpx; display: flex; flex-wrap: wrap; gap: 10rpx; }
.merchant-tag-chip { padding: 6rpx 12rpx; border-radius: 999rpx; font-size: 22rpx; line-height: 1.25; color: #6a7382; background: #f4f6fa; }
.merchant-service-tag-row { margin-top: 12rpx; }
.merchant-service-tag-chip { color: #9c5a67; background: #fffaf9; border: 1rpx solid #efcfd4; }
.merchant-quote-meta { margin-top: 16rpx; display: flex; align-items: center; flex-wrap: wrap; gap: 12rpx; font-size: 24rpx; color: #4b5563; }
.merchant-quote-code { margin-top: 10rpx; font-size: 24rpx; color: #4b5563; }
.merchant-remark-box { margin-top: 16rpx; padding: 16rpx 20rpx; border-radius: 14rpx; font-size: 24rpx; line-height: 1.6; color: #c8922b; background: #fff8eb; }
.bottom-bar { flex-shrink: 0; padding: 14rpx 20rpx calc(14rpx + env(safe-area-inset-bottom)); display: flex; align-items: center; justify-content: space-between; background: #ffffff; }
.bottom-left { flex: 1; min-width: 0; }
.selected-text { display: block; font-size: 26rpx; color: #3c4450; }
.total-price { display: block; margin-top: 6rpx; font-size: 34rpx; font-weight: 800; color: #d52028; }
.discount-text { display: block; margin-top: 6rpx; font-size: 24rpx; color: #9fa6af; }
.bottom-actions { display: flex; align-items: center; column-gap: 16rpx; margin-left: 20rpx; }
.secondary-btn { width: 164rpx; height: 84rpx; border-radius: 42rpx; display: flex; align-items: center; justify-content: center; font-size: 30rpx; font-weight: 600; color: #e02020; background: #fff1f1; border: 2rpx solid #ffb3b3; }
.primary-btn { width: 164rpx; height: 84rpx; border-radius: 42rpx; display: flex; align-items: center; justify-content: center; font-size: 32rpx; font-weight: 700; color: #ffffff; background: linear-gradient(135deg, #ff6b6b 0%, #e02020 100%); box-shadow: 0 10rpx 24rpx rgba(224, 32, 32, 0.24); }
</style>
