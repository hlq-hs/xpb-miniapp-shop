<template>
	<view class="coupon-page" :data-theme="theme">
		<view class="source-navbar acea-row row-around">
			<view class="item acea-row row-center-wrapper" :class="{ on: sourceOn === 'mall' }" @click="onSource('mall')">商城券</view>
			<view class="item acea-row row-center-wrapper" :class="{ on: sourceOn === 'external' }" @click="onSource('external')">外部券</view>
		</view>
		<view class="navbar acea-row row-around">
			<view class="item acea-row row-center-wrapper" :class="{ on: navOn === 'usable' }" @click="onNav('usable')">未使用</view>
			<view class="item acea-row row-center-wrapper" :class="{ on: navOn === 'unusable' }" @click="onNav('unusable')">已使用/过期</view>
		</view>
		<view class='coupon-list' v-if="couponsList.length">
			<view class='item acea-row row-center-wrapper' :class="{ 'external-item': item.source === 'external', 'external-used-item': item.source === 'external' && navOn !== 'usable' }" v-for='(item,index) in couponsList' :key="index">
				<view class='money' :class="item.validStr==='unusable'||item.validStr==='overdue'||item.validStr==='notStart' ? 'moneyGray' : 'main_bg'">
					<view>￥<text class='num':style="[{'font-size':String(item.money || '').length>=7?'42rpx':'60rpx'}]" >{{item.money?Number(item.money):''}}</text></view>
					<view class="pic-num" v-if="item.source === 'external'">优惠金额</view>
					<view class="pic-num" v-else>满{{ item.minPrice?Number(item.minPrice):'' }}元可用</view>
					<view class="money-use-date" v-if="item.source === 'external' && navOn !== 'usable'">{{item.useDate || '--'}}</view>
				</view>
				<view class='text'>
					<view class='condition'>
						<span class="coupon-name line1">{{item.name}}</span>
						<span v-if="item.source !== 'external'" class="line-title" :class="item.validStr==='unusable'||item.validStr==='overdue'||item.validStr==='notStart' ? 'bg-color-huic' : 'bg-color-check'">{{couponStateText(item.state)}}</span>
						<view class="external-meta line1" v-if="item.source === 'external' && item.shopName">门店：{{item.shopName}}</view>
						<view class="external-meta line1" v-if="item.source === 'external' && item.cusCarNo">车牌：{{item.cusCarNo}}</view>
					</view>
					<view class='data acea-row row-between-wrapper'>
						<view v-if="item.source === 'external'" class="external-date">
							<view class="external-date-range">有效期：{{item.useStartTimeStr}}~{{item.useEndTimeStr}}</view>
						</view>
						<view v-else>{{item.useStartTimeStr}}~{{item.useEndTimeStr}}</view>
					</view>
				</view>
				<view class="coupon-qr-entry" :class="{ 'external-qr-entry': item.source === 'external' }" v-if="canShowCouponQr(item)" @click.stop="showCouponQr(item)">
					<view></view>
					<view></view>
					<view></view>
					<view></view>
				</view>
			</view>
		</view>
		<view class='loadingicon acea-row row-center-wrapper' v-if="couponsList.length">
		     <text class='loading iconfont icon-jiazai' :hidden='loading==false'></text>{{loadTitle}}
		  </view>
		<view class='noCommodity' v-if="!couponsList.length">
			<view class='pictrue'>
				<image :src="urlDomain+'crmebimage/perset/staticImg/noCoupon.png'"></image>
			</view>
		</view>
		<view class="coupon-qr-mask" v-if="qrPopup" @click="closeCouponQr">
			<view class="coupon-qr-dialog" @click.stop>
				<view class="coupon-qr-title">{{qrCouponName}}</view>
				<image class="coupon-qr-img" v-if="qrCodeImg" :src="qrCodeImg"></image>
				<view class="coupon-qr-loading" v-else>二维码生成中...</view>
				<view class="coupon-qr-close" @click="closeCouponQr">关闭</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		getExternalVoucherInfoList,
		getUserCoupons
	} from '@/api/api.js';
	import {
		qrcodeApi
	} from '@/api/order.js';
	import {
		toLogin
	} from '@/libs/login.js';
	import {
		mapGetters
	} from "vuex";
	let app = getApp();
	export default {
		filters: {
		    validStrFilter(status) {
		      const statusMap = {
		        'usable': '可用',
		        'unusable': '已用',
				'overdue': '过期',
				'notStart': '未开始'
		      }
		      return statusMap[status]
		    }
		},
		data() {
			return {
				urlDomain: this.$Cache.get("imgHost"),
				couponsList: [],
				loading: false,
				loadend: false,
				loadTitle: '加载更多',//提示语
				page: 1,
				limit: 20,
				sourceOn: 'mall',
				navOn: 'usable',
				theme:app.globalData.theme,
				qrPopup: false,
				qrCodeImg: '',
				qrCouponName: '',
			};
		},
		computed: mapGetters(['isLogin', 'userInfo']),
		watch: {
			isLogin: {
				handler: function(newV, oldV) {
					if (newV) {
						this.resetCouponList();
						this.getUseCoupons();
					}
				},
				deep: true
			}
		},
		onLoad() {
			if (this.isLogin) {
				this.getUseCoupons();
			} else {
				toLogin();
			}
		},
		methods: {
			canShowCouponQr(item) {
				if (this.navOn !== 'usable') return false;
				return Number(item.state) === 1 || Number(item.state) === 2;
			},
			showCouponQr(item) {
				this.qrPopup = true;
				this.qrCodeImg = '';
				this.qrCouponName = item.name || '优惠券二维码';
				const couponQrText = this.buildCouponQrText(item);
				qrcodeApi({
					height: '220',
					width: '220',
					text: couponQrText
				}).then(res => {
					this.qrCodeImg = res.data.code;
				}).catch(err => {
					this.closeCouponQr();
					this.$util.Tips({
						title: err || '二维码生成失败'
					});
				});
			},
			buildCouponQrText(item) {
				if (item.source === 'external') {
					return [
						`shopId=${encodeURIComponent(item.shopId || '')}`,
						`vno=${encodeURIComponent(item.vno || '')}`,
						`vamount=${encodeURIComponent(item.vamount || '')}`,
						`beginDate=${encodeURIComponent(item.beginDate || '')}`,
						`endDate=${encodeURIComponent(item.endDate || '')}`
					].join('&');
				}
				return [
					`source=${encodeURIComponent(item.source || '')}`,
					`name=${encodeURIComponent(item.name || '')}`,
					`id=${encodeURIComponent(item.id || item.couponId || '')}`,
					`money=${encodeURIComponent(item.money || '')}`,
					`startTime=${encodeURIComponent(item.useStartTimeStr || item.startTime || '')}`,
					`endTime=${encodeURIComponent(item.useEndTimeStr || item.endTime || '')}`
				].join('&');
			},
			closeCouponQr() {
				this.qrPopup = false;
				this.qrCodeImg = '';
				this.qrCouponName = '';
			},
			couponStateText(state) {
				const stateMap = {
					0: '平台券',
					1: '门店券',
					2: '门店和平台通用'
				};
				return stateMap[Number(state)] || '平台券';
			},
			onSource: function(source) {
				if (this.sourceOn === source) return;
				this.sourceOn = source;
				this.resetCouponList();
				this.getUseCoupons();
			},
			onNav: function(type) {
				if (this.navOn === type) return;
				this.navOn = type;
				this.resetCouponList();
				this.getUseCoupons();
			},
			resetCouponList: function() {
				this.couponsList = [];
				this.page = 1;
				this.loadend = false;
				this.loadTitle = '加载更多';
			},
			/**
			 * 获取领取优惠券列表
			 */
			getUseCoupons: function() {
				let that = this;
				if(this.loadend) return false;
				if(this.loading) return false;
				that.loading = true;
				if (that.sourceOn === 'external') {
					that.getExternalCoupons();
					return;
				}
				getUserCoupons({ page: that.page, limit: that.limit, type: that.navOn}).then(res => {
					let list= res.data ? res.data.list : [],loadend=list.length < that.limit;
					let couponsList = that.$util.SplitArray(list.map(that.normalizeMallCoupon), that.couponsList);
					that.$set(that,'couponsList',couponsList);
					that.loadend = loadend;
					that.loadTitle = loadend ? '我也是有底线的~' : '加载更多';
					that.page = that.page + 1;
					that.loading = false;
				}).catch(err=>{
					  that.loading = false;
					  that.loadTitle = '加载更多';
				  });
			},
			getExternalCoupons: function() {
				let that = this;
				let phone = String((that.userInfo && (that.userInfo.phone || that.userInfo.mobile)) || '').trim();
				if (!phone) {
					that.loading = false;
					that.loadTitle = '加载更多';
					that.$util.Tips({
						title: '请先绑定手机号'
					});
					return;
				}
				let useFlag = that.navOn === 'usable' ? 0 : 1;
				getExternalVoucherInfoList({ phone, useFlag }).then(res => {
					let list = that.pickList(res.data);
					that.$set(that, 'couponsList', list.map(that.normalizeExternalCoupon));
					that.loadend = true;
					that.loadTitle = '我也是有底线的~';
					that.loading = false;
				}).catch(err => {
					that.loading = false;
					that.loadTitle = '加载更多';
				});
			},
			pickList: function(data) {
				if (Array.isArray(data)) return data;
				if (data && Array.isArray(data.list)) return data.list;
				if (data && Array.isArray(data.records)) return data.records;
				if (data && Array.isArray(data.rows)) return data.rows;
				return [];
			},
			normalizeMallCoupon: function(item) {
				return Object.assign({ source: 'mall' }, item);
			},
			normalizeExternalCoupon: function(item) {
				let useFlag = Number(item.useFlag);
				let startTime = item.beginDate || item.useStartTimeStr || item.startTime || item.startDate || item.beginTime || item.validStartTime || '';
				let endTime = item.endDate || item.useEndTimeStr || item.endTime || item.validEndTime || item.expireTime || '';
				let useDate = item.useDate || item.use_date || item.useTime || item.usedDate || item.usedTime || item.used_at || item.writeOffTime || item.consumeTime || item.verifyTime || '';
				if (useDate.indexOf('1900-01-01') === 0) useDate = '';
				return {
					source: 'external',
					id: item.id || item.voucherId || item.couponId || item.voucherNo || '',
					couponId: item.couponId || item.voucherId || item.id || '',
					name: item.vname || item.name || item.couponName || item.voucherName || item.title || '外部优惠券',
					money: item.vamount || item.money || item.amount || item.discountAmount || item.denomination || item.faceValue || '',
					minPrice: item.minPrice || item.fullAmount || item.thresholdAmount || item.useThreshold || item.conditionAmount || 0,
					useStartTimeStr: startTime,
					useEndTimeStr: endTime,
					useDate: useDate,
					shopId: item.shopId || '',
					vno: item.vno || '',
					vamount: item.vamount || '',
					beginDate: item.beginDate || '',
					endDate: item.endDate || '',
					shopName: item.shopName || '',
					cusCarNo: item.cusCarNo || '',
					state: item.state !== undefined ? item.state : 1,
					validStr: useFlag === 1 ? 'unusable' : 'usable',
					raw: item
				};
			}
		},
		/**
		  * 页面上拉触底事件的处理函数
		  */
		 onReachBottom: function () {
		   this.getUseCoupons();
		 }
	}
</script>

<style lang="scss" scoped>
	.coupon-page {
		min-height: 100vh;
		background: linear-gradient(180deg, #ffffff 0%, #f6f8fc 240rpx, #f7f8fb 100%);
		overflow: hidden;
	}

	.source-navbar,
	.navbar {
		position: fixed;
		left: 0;
		width: 100%;
		background-color: #ffffff;
		z-index: 9;
	
		.item {
			font-size: 30rpx;
			color: #999999;
			position: relative;
			&.on{
				color: #38bdf8;
			}
		}
	}

	.source-navbar {
		top: 0;
		height: 86rpx;
		.item {
			font-size: 30rpx;
			font-weight: 600;
			color: #333333;
		}
		.item.on::after {
			content: "";
			position: absolute;
			left: 50%;
			bottom: 0;
			width: 48rpx;
			height: 8rpx;
			border-radius: 8rpx;
			transform: translateX(-50%);
			background: #38bdf8;
		}
	}

	.navbar {
		top: 86rpx;
		left: 24rpx;
		right: 24rpx;
		width: auto;
		height: 104rpx;
		padding: 18rpx;
		background: #ffffff;
		border-radius: 22rpx;
		box-shadow: 0 18rpx 48rpx rgba(31, 45, 61, 0.08);
		box-sizing: border-box;
		.item {
			height: 68rpx;
			border-radius: 36rpx;
			font-size: 28rpx;
			color: #808999;
			background: #f3f5f8;
			flex: 1;
			margin: 0 8rpx;
			&.on {
				color: #ffffff;
				background: linear-gradient(90deg, #3b82ff 0%, #1f5dff 100%);
				box-shadow: 0 10rpx 22rpx rgba(37, 99, 235, 0.24);
			}
		}
	}
	
	
	.money {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.coupon-list .item .money.main_bg {
		position: relative;
		overflow: hidden;
		background-color: #2563eb !important;
		background-blend-mode: luminosity;
	}

	.coupon-list .item .money.main_bg::before {
		content: "";
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(90deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%);
		pointer-events: none;
	}

	.coupon-list .item .money.main_bg > view {
		position: relative;
		z-index: 1;
	}

	.bg_color{
		@include main_bg_color(theme);
	}
	.pic-num {
		color: #ffffff;
		font-size: 24rpx;
		font-weight: 600;
	}
	.money-use-date {
		position: relative;
		z-index: 3;
		max-width: 190rpx;
		margin: 18rpx auto 0;
		color: #ffffff;
		font-size: 18rpx;
		line-height: 24rpx;
		opacity: 0.95;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.coupon-list {
		margin-top: 218rpx;
		padding: 0 24rpx;
		box-sizing: border-box;
	}
	.coupon-list .item {
		position: relative;
		height: 242rpx;
		margin-bottom: 28rpx;
		background: #ffffff;
		border-radius: 18rpx;
		box-shadow: 0 18rpx 48rpx rgba(31, 45, 61, 0.08);
		overflow: hidden;
		align-items: stretch;
	}
	.coupon-list .item.external-item {
		height: 292rpx;
	}
	.coupon-list .item.external-used-item {
		height: 330rpx;
	}
	.coupon-list .item .money {
		width: 244rpx;
		height: 100%;
		position: relative;
		overflow: hidden;
		text-align: center;
	}
	.coupon-list .item .money::after {
		content: "";
		position: absolute;
		top: 0;
		right: -10rpx;
		width: 20rpx;
		height: 100%;
		background-image: radial-gradient(circle at center, #ffffff 0, #ffffff 8rpx, transparent 9rpx);
		background-size: 20rpx 32rpx;
		background-position: center 8rpx;
		z-index: 2;
	}
	.coupon-list .item .money .num {
		font-weight: 700;
	}
	.coupon-list .item .text{
		position: relative;
		width: calc(100% - 244rpx);
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 32rpx 82rpx 34rpx 32rpx;
		box-sizing: border-box;
	}
	.coupon-list .item .text .condition{
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		height: auto;
	}
	.condition .coupon-name {
		font-size: 34rpx;
		color: #282828;
		line-height: 42rpx;
		margin-bottom: 18rpx;
		max-width: 100%;
		min-height: 42rpx;
		font-weight: 700;
	}
	.condition .line-title {
		width: auto;
		min-width: 0;
		height: 44rpx !important;
		line-height: 42rpx !important;
		padding: 0 16rpx;
		-webkit-box-sizing: border-box;
		box-sizing: border-box;
		@include coupons_border_color(theme);
		opacity: 1;
		border-radius: 12rpx;
		font-size: 24rpx !important;
		@include main_color(theme);
		margin-right: 12rpx;
		margin-bottom: 12rpx;
		white-space: nowrap;
		background: #ffffff;
	}
	.condition .external-meta {
		max-width: 100%;
		margin-top: 10rpx;
		font-size: 26rpx;
		line-height: 34rpx;
		color: #666666;
	}
	.coupon-list .item .text .data {
		width: 100%;
		height: auto;
		min-width: 0;
		margin-top: 20rpx;
		padding-top: 18rpx;
		line-height: 34rpx;
		border-top: 1rpx dashed #e6e8ef;
		color: #7a8494;
		font-size: 26rpx;
	}
	.coupon-list .item .text .data > view:first-child {
		min-width: 0;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.coupon-list .item .text .data .external-date {
		width: 100%;
		overflow: visible;
		text-overflow: clip;
		white-space: normal;
	}
	.coupon-list .item .text .data .external-date view {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.coupon-list .item .text .data .external-date .external-date-range {
		overflow: visible;
		text-overflow: clip;
		white-space: normal;
		word-break: break-all;
	}
	.coupon-qr-entry {
		position: absolute;
		top: 22rpx;
		right: 24rpx;
		width: 42rpx;
		height: 42rpx;
		transform: none;
		display: grid;
		grid-template-columns: repeat(2, 10rpx);
		grid-template-rows: repeat(2, 10rpx);
		gap: 5rpx;
		align-content: center;
		justify-content: center;
		background: #d6d8dc;
		border: 2rpx solid #d6d8dc;
		border-radius: 6rpx;
		box-sizing: border-box;
		z-index: 2;
	}
	.coupon-qr-entry view {
		width: 10rpx;
		height: 10rpx;
		background: #ffffff;
		border-radius: 2rpx;
	}
	.coupon-qr-entry.external-qr-entry {
		top: 22rpx;
		right: 22rpx;
		transform: none;
	}
	.coupon-qr-mask {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.45);
		z-index: 999;
	}
	.coupon-qr-dialog {
		width: 560rpx;
		padding: 40rpx 32rpx 32rpx;
		background: #ffffff;
		border-radius: 16rpx;
		box-sizing: border-box;
		text-align: center;
	}
	.coupon-qr-title {
		margin-bottom: 28rpx;
		font-size: 30rpx;
		line-height: 42rpx;
		color: #282828;
	}
	.coupon-qr-img,
	.coupon-qr-loading {
		width: 360rpx;
		height: 360rpx;
		margin: 0 auto;
	}
	.coupon-qr-img {
		display: block;
	}
	.coupon-qr-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #999999;
		font-size: 26rpx;
	}
	.coupon-qr-close {
		width: 220rpx;
		height: 64rpx;
		margin: 32rpx auto 0;
		border-radius: 32rpx;
		background: #e93323;
		color: #ffffff;
		font-size: 28rpx;
		line-height: 64rpx;
	}
	.noCommodity {
		margin-top: 360rpx;
		opacity: 0.72;
	}
	.main_bg{
		@include main_bg_color(theme);
	}
</style>
