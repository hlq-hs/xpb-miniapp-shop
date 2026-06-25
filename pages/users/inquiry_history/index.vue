<template>
	<view class="history-page">
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
				<text class="nav-title">历史询价订单</text>
			</view>
		</view>

		<view class="toolbar">
			<text class="section-title">询价单</text>
			<view class="toolbar-actions">
				<view class="outline-btn" @click="handleRefresh">
					<text class="toolbar-icon">C</text>
					<text>刷新</text>
				</view>
				<view class="outline-btn" @click="toggleFilter">
					<text class="toolbar-icon">III</text>
					<text>筛选</text>
				</view>
			</view>
		</view>

		<scroll-view scroll-y class="content">
			<view class="search-box">
				<view class="search-icon"></view>
				<input
					v-model="keyword"
					class="search-input"
					type="text"
					placeholder="请输入询价单号"
					placeholder-class="search-placeholder"
					@confirm="handleRefresh"
				/>
			</view>

			<view
				v-for="item in filteredList"
				:key="item.id"
				class="history-card"
				@click="openOrder(item)"
			>
				<view class="card-head">
					<view class="head-main">
						<text class="vehicle-name">{{ item.vehicleName }}</text>
						<text class="vin-text">{{ item.vinCode }}</text>
						<text class="inquiry-no" v-if="item.externalInquiryId">询价单号: {{ item.externalInquiryId }}</text>
						<view class="status-row">
							<text class="status-badge" :class="item.statusClass">{{ item.statusText }}</text>
							<view class="status-dot"></view>
						</view>
					</view>
					<view class="trash-btn">
						<view class="trash-icon">
							<view class="trash-lid"></view>
							<view class="trash-body"></view>
							<view class="trash-line trash-line-left"></view>
							<view class="trash-line trash-line-middle"></view>
							<view class="trash-line trash-line-right"></view>
						</view>
					</view>
				</view>

				<view class="divider"></view>

				<view class="parts-text">{{ item.partsText }}</view>

				<view class="divider"></view>

				<view class="card-foot">
					<text class="foot-user">{{ item.contactName }}</text>
					<text class="foot-time">{{ item.createTime }}</text>
				</view>
			</view>

			<view v-if="!filteredList.length" class="empty-state">暂无匹配询价单</view>
			<view v-else class="list-end">
				<view class="end-line"></view>
				<text class="end-text">没有更多了</text>
				<view class="end-line"></view>
			</view>
		</scroll-view>

		<view v-if="showFilter" class="filter-mask" @click="toggleFilter">
			<view class="filter-panel" @click.stop>
				<view class="filter-title">询价单号</view>
				<view class="filter-field">
					<input
						v-model="filterForm.externalInquiryId"
						class="filter-input"
						type="text"
						placeholder="请输入询价单号"
						placeholder-class="filter-placeholder"
					/>
				</view>
				<view class="filter-field">
					<text class="filter-label">联系人</text>
					<input
						v-model="filterForm.mobile"
						class="filter-input"
						type="number"
						placeholder="请输入联系人手机号"
						placeholder-class="filter-placeholder"
					/>
				</view>
				<view class="filter-field">
					<text class="filter-label">询价状态</text>
					<picker mode="selector" :range="statusOptions" :value="statusIndex" @change="handleStatusChange">
						<view class="filter-picker">{{ statusOptions[statusIndex] }}</view>
					</picker>
				</view>
				<view class="filter-field">
					<text class="filter-label">询价开始时间</text>
					<picker mode="date" :value="filterForm.beginOpTime" @change="handleBeginDateChange">
						<view class="filter-picker" :class="{ 'is-placeholder': !filterForm.beginOpTime }">
							{{ filterForm.beginOpTime || '请选择开始日期' }}
						</view>
					</picker>
				</view>
				<view class="filter-field">
					<text class="filter-label">询价结束时间</text>
					<picker mode="date" :value="filterForm.endOpTime" @change="handleEndDateChange">
						<view class="filter-picker" :class="{ 'is-placeholder': !filterForm.endOpTime }">
							{{ filterForm.endOpTime || '请选择结束日期' }}
						</view>
					</picker>
				</view>
				<view class="filter-actions">
					<view class="filter-btn filter-reset" @click="resetFilter">清空选择</view>
					<view class="filter-btn filter-confirm" @click="confirmFilter">确定</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const STATUS_OPTIONS = ['全部状态', '待报价', '已报价', '已过期', '译码失败', '已下单'];
const STATUS_VALUE_MAP = ['', 1, 2, 3, 4, 6];

export default {
	data() {
		return {
			statusBarHeight: 20,
			navContentHeight: 44,
			keyword: '',
			showFilter: false,
			statusOptions: STATUS_OPTIONS,
			statusIndex: 0,
			historyList: [],
			total: 0,
			filterForm: {
				externalInquiryId: '',
				mobile: '',
				beginOpTime: '',
				endOpTime: ''
			},
			autoRefreshTimer: null
		};
	},
	computed: {
		navTotalHeight() {
			return this.statusBarHeight + this.navContentHeight;
		},
		filteredList() {
			const keyword = (this.keyword || '').trim().toLowerCase();
			return this.historyList.filter(item => {
				const matchKeyword = !keyword || [
					item.vehicleName,
					item.vinCode,
					item.partsText,
					item.contactName,
					item.createTime,
					item.externalInquiryId
				].join(' ').toLowerCase().includes(keyword);
				return matchKeyword;
			});
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
		this.fetchHistoryList();
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
		getRequestPayload() {
			const getters = (this.$store && this.$store.getters) || {};
			const userInfo = getters.userInfo || {};
			return {
				pagesize: 20,
				pageno: 1,
				userId: Number(getters.uid || 0) || 0,
				mobile: (this.filterForm.mobile || userInfo.phone || '').trim(),
				externalInquiryId: (this.filterForm.externalInquiryId || this.keyword || '').trim(),
				requestStatus: STATUS_VALUE_MAP[this.statusIndex] || null,
				beginOpTime: this.filterForm.beginOpTime ? `${this.filterForm.beginOpTime} 00:00:00` : null,
				endOpTime: this.filterForm.endOpTime ? `${this.filterForm.endOpTime} 23:59:59` : null
			};
		},
		requestHistoryList(payload) {
			return new Promise((resolve, reject) => {
				uni.request({
					url: 'https://xpbn.kbiso.com/api/MiniKaisi/QuotationRequest/GetList',
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
		parseUserNeeds(userNeeds) {
			if (!userNeeds) return [];
			if (Array.isArray(userNeeds)) return userNeeds;
			if (typeof userNeeds === 'string') {
				try {
					const parsed = JSON.parse(userNeeds);
					return Array.isArray(parsed) ? parsed : [];
				} catch (error) {
					return [];
				}
			}
			return [];
		},
		getStatusText(status) {
			const statusNum = Number(status);
			const textMap = {
				1: '待报价',
				2: '已报价',
				3: '已过期',
				4: '译码失败',
				6: '已下单'
			};
			return textMap[statusNum] || '待报价';
		},
		getStatusClass(status) {
			const statusNum = Number(status);
			const classMap = {
				1: 'is-pending',
				2: 'is-quoted',
				3: 'is-expired',
				4: 'is-failed',
				6: 'is-ordered'
			};
			return classMap[statusNum] || 'is-pending';
		},
		formatTime(value) {
			if (!value) return '';
			return String(value).replace('T', ' ').slice(0, 19);
		},
		normalizeHistoryList(list) {
			if (!Array.isArray(list)) return [];
			return list.map((item, index) => {
				const userNeeds = this.parseUserNeeds(item && item.userNeeds);
				const vehicleName =
					item.carModelName ||
					[item.carBrandName, item.carModelName].filter(Boolean).join(' ') ||
					'车型信息';
				return {
					id: item.id || item.externalInquiryId || `${Date.now()}-${index}`,
					externalInquiryId: item.externalInquiryId || '',
					vehicleName,
					vinCode: item.vin || '',
					status: Number(item.requestStatus) || 1,
					statusText: this.getStatusText(item.requestStatus),
					statusClass: this.getStatusClass(item.requestStatus),
					partsText: userNeeds
						.map(need => need.needsName || need.oeName || need.stdName || '')
						.filter(Boolean)
						.join('、'),
					contactName: item.userName || item.contactName || '',
					createTime: this.formatTime(item.opTime),
					raw: item
				};
			});
		},
		async fetchHistoryList(showSuccessToast = false) {
			uni.showLoading({
				title: '加载中',
				mask: true
			});
			try {
				const result = await this.requestHistoryList(this.getRequestPayload());
				if (!result || Number(result.msgid) !== 200) {
					uni.showToast({
						title: (result && result.msgtext) || '加载失败',
						icon: 'none'
					});
					this.historyList = [];
					this.total = 0;
					return;
				}
				this.historyList = this.normalizeHistoryList(result.data);
				this.total = Number(result.total || 0) || 0;
				if (showSuccessToast) {
					uni.showToast({
						title: '刷新成功',
						icon: 'success'
					});
				}
			} catch (error) {
				this.historyList = [];
				this.total = 0;
				uni.showToast({
					title: '加载失败，请稍后重试',
					icon: 'none'
				});
			} finally {
				uni.hideLoading();
			}
		},
		startAutoRefresh() {
			this.stopAutoRefresh();
			this.autoRefreshTimer = setInterval(() => {
				this.fetchHistoryList();
			}, 15000);
		},
		stopAutoRefresh() {
			if (!this.autoRefreshTimer) return;
			clearInterval(this.autoRefreshTimer);
			this.autoRefreshTimer = null;
		},
		handleRefresh() {
			this.fetchHistoryList(true);
		},
		toggleFilter() {
			this.showFilter = !this.showFilter;
		},
		handleStatusChange(event) {
			this.statusIndex = Number(event.detail.value);
		},
		handleBeginDateChange(event) {
			this.filterForm.beginOpTime = event.detail.value;
		},
		handleEndDateChange(event) {
			this.filterForm.endOpTime = event.detail.value;
		},
		resetFilter() {
			this.statusIndex = 0;
			this.filterForm = {
				externalInquiryId: '',
				mobile: '',
				beginOpTime: '',
				endOpTime: ''
			};
		},
		confirmFilter() {
			this.keyword = this.filterForm.externalInquiryId;
			this.showFilter = false;
			this.fetchHistoryList();
		},
		openOrder(item) {
			uni.setStorageSync('inquiryOrderHistoryCurrent', item.raw || item);
			uni.navigateTo({
				url: `/pages/users/inquiry_order/index?id=${encodeURIComponent(item.id || '')}&externalInquiryId=${encodeURIComponent(item.externalInquiryId || '')}&vinCode=${encodeURIComponent(item.vinCode || '')}&vehicleName=${encodeURIComponent(item.vehicleName || '')}`
			});
		}
	}
};
</script>

<style scoped lang="scss">
.history-page { height: 100vh; background: #f6f7f9; display: flex; flex-direction: column; overflow: hidden; }
.nav-shell { flex-shrink: 0; background: #303030; }
.nav-row { position: relative; display: flex; align-items: center; justify-content: center; padding: 0 36rpx; }
.nav-back { position: absolute; left: 22rpx; top: 50%; width: 60rpx; height: 60rpx; transform: translateY(-50%); }
.nav-back-line { position: absolute; left: 16rpx; width: 4rpx; height: 30rpx; border-radius: 999rpx; background: #ffffff; transform-origin: center; }
.nav-back-line-top { top: 10rpx; transform: rotate(45deg); }
.nav-back-line-bottom { top: 28rpx; transform: rotate(-45deg); }
.nav-title { font-size: 36rpx; font-weight: 500; color: #ffffff; }
.toolbar { display: flex; align-items: center; justify-content: space-between; padding: 26rpx 28rpx 18rpx; background: #ffffff; }
.section-title { font-size: 42rpx; font-weight: 700; color: #161b22; }
.toolbar-actions { display: flex; align-items: center; column-gap: 16rpx; }
.outline-btn { height: 60rpx; padding: 0 24rpx; border: 3rpx solid #0d84de; border-radius: 999rpx; display: flex; align-items: center; justify-content: center; column-gap: 8rpx; font-size: 29rpx; color: #0d84de; background: #ffffff; box-sizing: border-box; }
.toolbar-icon { font-size: 27rpx; line-height: 1; }
.content { flex: 1; height: 0; padding: 18rpx 26rpx 36rpx; box-sizing: border-box; }
.search-box { height: 88rpx; padding: 0 30rpx; border-radius: 44rpx; display: flex; align-items: center; background: #ffffff; box-shadow: 0 8rpx 22rpx rgba(41, 58, 84, 0.05); }
.search-icon { position: relative; width: 27rpx; height: 27rpx; margin-right: 20rpx; border: 3rpx solid #98a2b0; border-radius: 50%; box-sizing: border-box; }
.search-icon::after { content: ''; position: absolute; right: -10rpx; bottom: -7rpx; width: 14rpx; height: 3rpx; border-radius: 999rpx; background: #98a2b0; transform: rotate(45deg); }
.search-input { flex: 1; height: 88rpx; font-size: 30rpx; color: #343a44; }
.search-placeholder { color: #a0a7b0; }
.history-card { margin-top: 22rpx; padding: 26rpx 30rpx 22rpx; border-radius: 24rpx; background: #ffffff; box-shadow: 0 8rpx 22rpx rgba(38, 57, 79, 0.05); }
.card-head { display: flex; align-items: flex-start; justify-content: space-between; }
.head-main { flex: 1; min-width: 0; }
.vehicle-name { display: block; font-size: 34rpx; font-weight: 700; line-height: 1.35; color: #20252d; }
.vin-text { display: block; margin-top: 10rpx; font-size: 25rpx; color: #9aa0a9; word-break: break-all; }
.inquiry-no { display: block; margin-top: 8rpx; font-size: 24rpx; color: #8f96a0; word-break: break-all; }
.status-row { margin-top: 14rpx; display: flex; align-items: center; }
.status-badge { padding: 8rpx 16rpx; border-radius: 10rpx; font-size: 25rpx; font-weight: 600; }
.status-badge.is-pending { color: #14a264; background: #eefbf4; }
.status-badge.is-quoted { color: #14a264; background: #eefbf4; }
.status-badge.is-expired { color: #d97706; background: #fff7e8; }
.status-badge.is-failed { color: #dc2626; background: #fff1f2; }
.status-badge.is-ordered { color: #2563eb; background: #eef4ff; }
.status-dot { width: 22rpx; height: 22rpx; margin-left: 10rpx; border-radius: 50%; background: #278df3; }
.trash-btn { width: 56rpx; height: 56rpx; margin-left: 18rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26rpx; color: #c3c8d0; background: #f6f7f9; }
.trash-icon { position: relative; width: 24rpx; height: 26rpx; }
.trash-lid { position: absolute; left: 3rpx; top: 2rpx; width: 18rpx; height: 4rpx; border-radius: 999rpx; background: #c3c8d0; }
.trash-lid::before { content: ''; position: absolute; left: 6rpx; top: -4rpx; width: 6rpx; height: 4rpx; border-radius: 999rpx 999rpx 0 0; border: 2rpx solid #c3c8d0; border-bottom: 0; box-sizing: border-box; }
.trash-body { position: absolute; left: 4rpx; top: 8rpx; width: 16rpx; height: 16rpx; border: 2rpx solid #c3c8d0; border-top: 0; border-radius: 0 0 4rpx 4rpx; box-sizing: border-box; }
.trash-line { position: absolute; top: 12rpx; width: 2rpx; height: 8rpx; border-radius: 999rpx; background: #c3c8d0; }
.trash-line-left { left: 8rpx; }
.trash-line-middle { left: 11rpx; }
.trash-line-right { left: 14rpx; }
.divider { height: 1rpx; margin: 22rpx 0; background: #eef1f4; }
.parts-text { font-size: 28rpx; line-height: 1.7; color: #333842; }
.card-foot { display: flex; align-items: center; justify-content: space-between; column-gap: 20rpx; font-size: 24rpx; color: #9da3ac; }
.foot-user { flex: 1; min-width: 0; }
.foot-time { flex-shrink: 0; }
.empty-state { padding-top: 220rpx; text-align: center; font-size: 28rpx; color: #c1c6cd; }
.list-end { margin-top: 34rpx; display: flex; align-items: center; justify-content: center; color: #8f959f; }
.end-line { width: 110rpx; height: 1rpx; background: #d7dbe2; }
.end-text { margin: 0 20rpx; font-size: 28rpx; }
.filter-mask { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: flex-end; background: rgba(0,0,0,0.42); }
.filter-panel { width: 100%; max-height: 78vh; padding: 34rpx 32rpx calc(24rpx + env(safe-area-inset-bottom)); border-radius: 32rpx 32rpx 0 0; background: #ffffff; box-sizing: border-box; }
.filter-title { font-size: 32rpx; font-weight: 700; color: #20242b; }
.filter-field { margin-top: 34rpx; }
.filter-label { display: block; margin-bottom: 16rpx; font-size: 30rpx; font-weight: 600; color: #20242b; }
.filter-input,
.filter-picker { height: 86rpx; padding: 0 28rpx; border-radius: 16rpx; display: flex; align-items: center; background: #f5f7fb; font-size: 28rpx; color: #343944; box-sizing: border-box; }
.filter-input { width: 100%; }
.filter-placeholder,
.filter-picker.is-placeholder { color: #a0a7b0; }
.filter-actions { display: flex; margin: 40rpx -32rpx -24rpx; padding-bottom: env(safe-area-inset-bottom); }
.filter-btn { flex: 1; height: 96rpx; display: flex; align-items: center; justify-content: center; font-size: 32rpx; font-weight: 600; }
.filter-reset { color: #4b5563; background: #ffffff; }
.filter-confirm { color: #ffffff; background: #1685ee; }
</style>
