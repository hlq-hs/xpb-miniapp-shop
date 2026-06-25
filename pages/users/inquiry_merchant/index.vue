<template>
	<view class="page">
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
				<text class="nav-title">商家列表</text>
			</view>
		</view>

		<view class="search-wrap">
			<view class="search-box">
				<text class="search-icon">Q</text>
				<input
					v-model="keyword"
					class="search-input"
					type="text"
					placeholder="请输入商家名称"
					placeholder-class="search-placeholder"
					@input="refreshList"
				/>
			</view>
		</view>

		<view v-if="tabs.length" class="tab-bar">
			<view
				v-for="tab in tabs"
				:key="tab.value"
				class="tab-item"
				:class="{ active: activeTab === tab.value }"
				@tap="switchTab(tab.value)"
			>
				<text>{{ tab.label }}</text>
				<view v-if="activeTab === tab.value" class="tab-line"></view>
			</view>
		</view>

		<scroll-view scroll-y class="list-scroll">
			<view v-if="isLoading" class="state-box">加载中...</view>
			<view v-else-if="errorText" class="state-box error">{{ errorText }}</view>
			<template v-else>
				<view
					v-for="(item, index) in visibleList"
					:key="index"
					class="merchant-item"
					:class="{ active: isSelected(item.storeId) }"
					@tap="toggleMerchantByIndex(index)"
				>
					<view class="merchant-content">
						<text class="merchant-name">{{ item.storeName }}</text>
						<view class="merchant-meta-row">
							<text
								class="merchant-badge"
								:class="{ disabled: item.canAllocate === false }"
							>
								{{ item.canAllocate === false ? '不可询价' : '可询价' }}
							</text>
							<text v-if="item.groupTitle" class="merchant-meta">{{ item.groupTitle }}</text>
							<text v-if="item.canAllocate === false && item.reason" class="merchant-meta">
								{{ item.reason }}
							</text>
							<text v-else-if="item.todayIsWeekday === false && item.nextWeekdayText" class="merchant-meta">
								下个工作日: {{ item.nextWeekdayText }}
							</text>
						</view>
					</view>
					<view
						class="radio"
						:class="{ selected: isSelected(item.storeId) }"
						@tap.stop="toggleMerchantByIndex(index)"
					>
						<view v-if="isSelected(item.storeId)" class="radio-inner"></view>
					</view>
				</view>
				<view v-if="!visibleList.length" class="empty">暂无匹配商家</view>
			</template>
		</scroll-view>

		<view class="bottom-bar">
			<view class="selected-box">已选商家 {{ selectedMerchants.length }}</view>
			<view class="confirm-btn" @tap="confirmSelection">确定</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			statusBarHeight: 20,
			navContentHeight: 44,
			tabs: [],
			activeTab: '',
			keyword: '',
			allMerchants: [],
			visibleList: [],
			selectedMerchants: [],
			isLoading: false,
			errorText: ''
		};
	},
	computed: {
		navTotalHeight() {
			return this.statusBarHeight + this.navContentHeight;
		}
	},
	onLoad(options) {
		const info = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {};
		this.statusBarHeight = info.statusBarHeight || 20;
		this.navContentHeight = this.getNavContentHeight();

		if (options && options.selected) {
			try {
				const selected = JSON.parse(decodeURIComponent(options.selected));
				this.selectedMerchants = Array.isArray(selected)
					? selected
						.map(item => {
							if (item && typeof item === 'object') {
								return {
									storeId: String(item.storeId || ''),
									storeName: item.storeName || ''
								};
							}
							return null;
						})
						.filter(item => item && item.storeId && item.storeName)
					: [];
			} catch (error) {
				this.selectedMerchants = [];
			}
		}

		this.fetchSuppliers();
	},
	methods: {
		getNavContentHeight() {
			let navContentHeight = 44;
			// #ifdef MP-WEIXIN
			const menuButton = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null;
			if (menuButton && menuButton.height) {
				navContentHeight = Math.max(menuButton.height + 12, 44);
			}
			// #endif
			return navContentHeight;
		},
		handleBack() {
			uni.navigateBack({ delta: 1 });
		},
		getRequestContext() {
			return uni.getStorageSync('inquirySupplierRequestContext') || {};
		},
		getSupplierPayload() {
			const getters = (this.$store && this.$store.getters) || {};
			const userInfo = getters.userInfo || {};
			const uid = getters.uid || 0;
			const context = this.getRequestContext();
			const vehicleInfo = uni.getStorageSync('inquiryVehicleInfo') || {};
			const address = context.selectedAddress || {};
			const selectedQualityValues = Array.isArray(context.selectedQualityValues)
				? context.selectedQualityValues.filter(Boolean)
				: [];
			const selectedQualityLabel = context.selectedQualityLabel || '';
			const qualities = selectedQualityValues.length
				? selectedQualityValues
				: (selectedQualityLabel ? [selectedQualityLabel] : []);

			return {
				userId: Number(uid) || 0,
				mobile: userInfo.phone || '',
				userName: userInfo.nickname || userInfo.realName || '',
				carBrandId: String(vehicleInfo.carBrandCode || vehicleInfo.carBrandId || vehicleInfo.brandId || vehicleInfo.levelId || ''),
				isOpenInvoice: false,
				qualities,
				provinceGeoName: address.province || '',
				cityGeoName: address.city || '',
				countyGeoName: address.district || '',
				villageGeoName: address.street || address.district || address.city || '',
				address: address.detail || '',
				longitude: String(address.longitude || address.longitudeX || uni.getStorageSync('user_longitude') || ''),
				latitude: String(address.latitude || address.dimensionY || uni.getStorageSync('user_latitude') || '')
			};
		},
		requestSuppliers(payload) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/GetAppointedSupplier',
					method: 'POST',
					header: {
						'Content-Type': 'application/json'
					},
					data: payload,
					success: (res) => resolve((res && res.data) || {}),
					fail: reject
				});
			});
		},
		formatNextWeekday(value) {
			if (!value) return '';
			const num = Number(value);
			if (!num) return '';
			const date = new Date(num);
			if (Number.isNaN(date.getTime())) return '';
			const y = date.getFullYear();
			const m = `${date.getMonth() + 1}`.padStart(2, '0');
			const d = `${date.getDate()}`.padStart(2, '0');
			return `${y}-${m}-${d}`;
		},
		normalizeGroups(list) {
			if (!Array.isArray(list)) return [];
			return list
				.map((group, index) => {
					const title = (group && group.title) || `分组${index + 1}`;
					const value = `group_${index}`;
					const data = Array.isArray(group && group.data)
						? group.data.map((item, itemIndex) => ({
							storeId: item && item.storeId ? String(item.storeId) : `${value}_${itemIndex}`,
							storeName: (item && item.storeName) || `商家${itemIndex + 1}`,
							canAllocate: item ? item.canAllocate : null,
							todayIsWeekday: item ? item.todayIsWeekday : null,
							nextWeekdayText: this.formatNextWeekday(item && item.nextWeekday),
							reason: (item && item.reason) || '',
							groupTitle: title,
							groupValue: value
						}))
						: [];
					return { label: title, value, data };
				})
				.filter(group => group.data.length);
		},
		async fetchSuppliers() {
			this.isLoading = true;
			this.errorText = '';
			try {
				const payload = this.getSupplierPayload();
				const result = await this.requestSuppliers(payload);
				const groups = this.normalizeGroups(result && result.data);
				this.tabs = groups.map(group => ({ label: group.label, value: group.value }));
				this.allMerchants = groups.flatMap(group => group.data);
				this.activeTab = this.tabs.length ? this.tabs[0].value : '';
				this.refreshList();
				if (!this.allMerchants.length) {
					this.errorText = '暂无可选商家';
				}
			} catch (error) {
				this.tabs = [];
				this.allMerchants = [];
				this.visibleList = [];
				this.errorText = '商家加载失败';
			} finally {
				this.isLoading = false;
			}
		},
		switchTab(tabValue) {
			this.activeTab = tabValue;
			this.refreshList();
		},
		refreshList() {
			const keyword = (this.keyword || '').trim().toLowerCase();
			this.visibleList = this.allMerchants.filter(item => {
				const matchTab = !this.activeTab || item.groupValue === this.activeTab;
				const matchKeyword = !keyword || (item.storeName || '').toLowerCase().includes(keyword);
				return matchTab && matchKeyword;
			});
		},
		isSelected(storeId) {
			return this.selectedMerchants.some(item => item && item.storeId === storeId);
		},
		toggleMerchantByIndex(listIndex) {
			const item = this.visibleList[listIndex];
			if (!item) return;
			const storeId = item.storeId;
			const storeName = item.storeName;
			const canAllocate = item.canAllocate;
			const reason = item.reason;
			if (!storeId || !storeName) return;
			if (canAllocate === false) {
				uni.showToast({
					title: reason || '该商家暂不可选',
					icon: 'none'
				});
				return;
			}
			const nextSelected = this.selectedMerchants.slice();
			const selectedIndex = nextSelected.findIndex(selectedItem => selectedItem && selectedItem.storeId === storeId);
			if (selectedIndex > -1) {
				nextSelected.splice(selectedIndex, 1);
				this.selectedMerchants = nextSelected;
				return;
			}
			nextSelected.push({
				storeId,
				storeName
			});
			this.selectedMerchants = nextSelected;
		},
		confirmSelection() {
			uni.setStorageSync('inquirySelectedSuppliers', this.selectedMerchants);
			uni.navigateBack({ delta: 1 });
		}
	}
};
</script>

<style scoped lang="scss">
.page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f6f7f9;
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
	font-size: 36rpx;
	font-weight: 500;
	color: #ffffff;
}

.search-wrap {
	padding: 20rpx 26rpx 14rpx;
	background: #ffffff;
}

.search-box {
	height: 70rpx;
	padding: 0 24rpx;
	border-radius: 36rpx;
	display: flex;
	align-items: center;
	background: #f4f6fb;
}

.search-icon {
	margin-right: 14rpx;
	font-size: 28rpx;
	color: #9aa2ac;
}

.search-input {
	flex: 1;
	height: 70rpx;
	font-size: 27rpx;
	color: #2d3138;
}

.search-placeholder {
	color: #a1a7b0;
}

.tab-bar {
	display: flex;
	background: #ffffff;
	border-top: 1rpx solid #f0f1f3;
	border-bottom: 1rpx solid #f0f1f3;
}

.tab-item {
	flex: 1;
	height: 86rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	font-weight: 500;
	color: #666d76;
}

.tab-item.active {
	color: #1487ed;
}

.tab-line {
	width: 46rpx;
	height: 4rpx;
	margin-top: 10rpx;
	border-radius: 999rpx;
	background: #1487ed;
}

.list-scroll {
	flex: 1;
	min-height: 0;
	background: #ffffff;
}

.merchant-item {
	padding: 28rpx 30rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1rpx solid #f1f2f5;
}

.merchant-item.active {
	background: #f4f9ff;
}

.merchant-content {
	flex: 1;
	min-width: 0;
	padding-right: 24rpx;
}

.merchant-name {
	display: block;
	font-size: 30rpx;
	font-weight: 600;
	line-height: 1.45;
	color: #22272f;
}

.merchant-meta-row {
	margin-top: 10rpx;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	row-gap: 8rpx;
}

.merchant-badge {
	padding: 4rpx 10rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	color: #7892b4;
	background: #eef5ff;
}

.merchant-badge.disabled {
	color: #d85b54;
	background: #fff1ef;
}

.merchant-meta {
	margin-left: 10rpx;
	font-size: 22rpx;
	color: #9aa1aa;
}

.radio {
	width: 42rpx;
	height: 42rpx;
	border: 2rpx solid #d8dde5;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	box-sizing: border-box;
}

.radio.selected {
	border-color: #1487ed;
	background: #eaf4ff;
}

.radio-inner {
	width: 22rpx;
	height: 22rpx;
	border-radius: 50%;
	background: #1487ed;
}

.state-box,
.empty {
	padding-top: 160rpx;
	text-align: center;
	font-size: 26rpx;
	color: #9ca3ad;
}

.state-box.error {
	color: #d85b54;
}

.bottom-bar {
	flex-shrink: 0;
	padding: 16rpx 26rpx calc(16rpx + env(safe-area-inset-bottom));
	display: flex;
	align-items: center;
	column-gap: 18rpx;
	background: #ffffff;
}

.selected-box {
	flex: 0 0 220rpx;
	height: 74rpx;
	border-radius: 37rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	color: #4b525c;
	background: #f2f5fb;
}

.confirm-btn {
	flex: 1;
	height: 74rpx;
	border-radius: 37rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 31rpx;
	font-weight: 600;
	color: #ffffff;
	background: #1685ee;
}
</style>
