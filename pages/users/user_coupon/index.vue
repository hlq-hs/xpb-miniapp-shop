<template>
	<view :data-theme="theme">
		<view class="navbar acea-row row-around">
			<view class="item acea-row row-center-wrapper" :class="{ on: navOn === 'usable' }" @click="onNav('usable')">未使用</view>
			<view class="item acea-row row-center-wrapper" :class="{ on: navOn === 'unusable' }" @click="onNav('unusable')">已使用/过期</view>
		</view>
		<view class='coupon-list' v-if="couponsList.length">
			<view class='item acea-row row-center-wrapper' v-for='(item,index) in couponsList' :key="index">
				<view class='money' :class="item.validStr==='unusable'||item.validStr==='overdue'||item.validStr==='notStart' ? 'moneyGray' : 'main_bg'">
					<view>￥<text class='num':style="[{'font-size':item.money.length>=7?'42rpx':'60rpx'}]" >{{item.money?Number(item.money):''}}</text></view>
					<view class="pic-num">满{{ item.minPrice?Number(item.minPrice):'' }}元可用</view>
				</view>
				<view class='text'>
					<view class='condition'>
						<span class="coupon-name line1">{{item.name}}</span>
						<span class="line-title" :class="item.validStr==='unusable'||item.validStr==='overdue'||item.validStr==='notStart' ? 'bg-color-huic' : 'bg-color-check'">{{couponStateText(item.state)}}</span>
					</view>
					<view class='data acea-row row-between-wrapper'>
						<view>{{item.useStartTimeStr}}~{{item.useEndTimeStr}}</view>
					</view>
				</view>
				<view class="coupon-qr-entry" v-if="canShowCouponQr(item)" @click.stop="showCouponQr(item)">
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
				navOn: 'usable',
				theme:app.globalData.theme,
				qrPopup: false,
				qrCodeImg: '',
				qrCouponName: '',
			};
		},
		computed: mapGetters(['isLogin']),
		watch: {
			isLogin: {
				handler: function(newV, oldV) {
					if (newV) {
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
				return Number(item.state) === 1 || Number(item.state) === 2;
			},
			showCouponQr(item) {
				this.qrPopup = true;
				this.qrCodeImg = '';
				this.qrCouponName = item.name || '优惠券二维码';
				const couponQrText = [
					`name=${encodeURIComponent(item.name || '')}`,
					`id=${encodeURIComponent(item.id || item.couponId || '')}`,
					`money=${encodeURIComponent(item.money || '')}`,
					`startTime=${encodeURIComponent(item.useStartTimeStr || item.startTime || '')}`,
					`endTime=${encodeURIComponent(item.useEndTimeStr || item.endTime || '')}`
				].join('&');
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
			onNav: function(type) {
				this.navOn = type;
				this.couponsList = [];
				this.page = 1;
				this.loadend = false;
				this.getUseCoupons();
			},
			/**
			 * 获取领取优惠券列表
			 */
			getUseCoupons: function() {
				let that = this;
				if(this.loadend) return false;
				if(this.loading) return false;
				getUserCoupons({ page: that.page, limit: that.limit, type: that.navOn}).then(res => {
					let list= res.data ? res.data.list : [],loadend=list.length < that.limit;
					let couponsList = that.$util.SplitArray(list, that.couponsList);
					that.$set(that,'couponsList',couponsList);
					that.loadend = loadend;
					that.loadTitle = loadend ? '我也是有底线的~' : '加载更多';
					that.page = that.page + 1;
					that.loading = false;
				}).catch(err=>{
					  that.loading = false;
					  that.loadTitle = '加载更多';
				  });
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
	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 106rpx;
		background-color: #FFFFFF;
		z-index: 9;
	
		.item {
			border-top: 5rpx solid transparent;
			border-bottom: 5rpx solid transparent;
			font-size: 30rpx;
			color: #999999;
			&.on{
				@include tab_border_bottom(theme);
				@include main_color(theme);
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
	}
	.coupon-list {
		margin-top: 122rpx;
	}
	.coupon-list .item {
		position: relative;
		height: 190rpx;
	}
	.coupon-list .item .text{
		width: calc(100% - 240rpx);
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 18rpx 88rpx 18rpx 16rpx;
		box-sizing: border-box;
	}
	.coupon-list .item .text .condition{
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		height: auto;
	}
	.condition .coupon-name {
		font-size: 28rpx;
		color: #282828;
		line-height: 34rpx;
		margin-bottom: 12rpx;
		max-width: 100%;
		min-height: 34rpx;
	}
	.condition .line-title {
		width: auto;
		min-width: 0;
		height: 34rpx !important;
		line-height: 32rpx !important;
		padding: 0 10rpx;
		-webkit-box-sizing: border-box;
		box-sizing: border-box;
		@include coupons_border_color(theme);
		opacity: 1;
		border-radius: 20rpx;
		font-size: 18rpx !important;
		@include main_color(theme);
		margin-right: 12rpx;
		white-space: nowrap;
	}
	.coupon-list .item .text .data {
		width: 100%;
		height: auto;
		min-width: 0;
		margin-top: 12rpx;
		line-height: 30rpx;
	}
	.coupon-list .item .text .data > view:first-child {
		min-width: 0;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.coupon-qr-entry {
		position: absolute;
		top: 30rpx;
		right: 22rpx;
		width: 46rpx;
		height: 46rpx;
		display: grid;
		grid-template-columns: repeat(2, 12rpx);
		grid-template-rows: repeat(2, 12rpx);
		gap: 6rpx;
		align-content: center;
		justify-content: center;
		background: #d8d8d8;
		border: 2rpx solid #d8d8d8;
		border-radius: 6rpx;
		box-sizing: border-box;
		z-index: 2;
	}
	.coupon-qr-entry view {
		width: 12rpx;
		height: 12rpx;
		background: #ffffff;
		border-radius: 2rpx;
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
		margin-top: 300rpx;
	}
	.main_bg{
		@include main_bg_color(theme);
	}
</style>
