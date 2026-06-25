<template>
	<!-- 底部导航 -->
	<view :data-theme="theme">
		<view v-if="obj.isCustom==1">
			<view class="page-footer" id="target">
				<view class="foot-item" v-for="(item,index) in obj.bottomNavigationList" :key="index"
					@click="goRouter(item)">
					<block v-if="isActive(item)">
						<view v-if="fixedIcons[index] && fixedIcons[index].type === 'category'" class="nav-category-icon checked">
							<view></view><view></view><view></view><view></view>
						</view>
						<text v-else class="iconfont nav-icon checked" :class="fixedIcons[index] || fixedIcons[0]"></text>
						<view class="txt">{{item.name}}</view>
					</block>
					<block v-else>
						<view v-if="fixedIcons[index] && fixedIcons[index].type === 'category'" class="nav-category-icon">
							<view></view><view></view><view></view><view></view>
						</view>
						<text v-else class="iconfont nav-icon" :class="fixedIcons[index] || fixedIcons[0]"></text>
						<view class="unchecked">{{item.name}}</view>
					</block>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	let app = getApp();
	import {getBottomNavigationApi} from '@/api/api.js'
	export default {
		props:{
			arr: {
				type: Array,
				default: () => []
			},
		},
		data() {
			return {
				theme: app.globalData.theme,
				obj: {},
				activeRouter: '',
				imgHost: this.$Cache.get('imgHost') || '',
				fixedIcons: [
					'icon-shouye8',
					{
						type: 'category'
					},
					'icon-quanbudingdan-xingerenzhongxin',
					'icon-fanhuishouye',
					'icon-gerenzhongxin1'
				]
			}
		},
		created() {
			let routes = getCurrentPages(); //获取当前打开过的页面路由数组
			let curRoute = routes[routes.length - 1].route //获取当前页面路由
			this.activeRouter = '/' + curRoute;
		},	
		mounted() {
			this.getInit()
		},
		methods: {
			isActive(item) {
				return this.normalizeLink(item.link).split('?')[0] == this.activeRouter;
			},
			formatImage(url) {
				if (!url) return '';
				if (/^(data:|https?:\/\/|\/\/|\/static\/)/i.test(url)) return url;
				if (url.startsWith('static/')) return `/${url}`;
				const imgHost = this.imgHost || this.$Cache.get('imgHost') || '';
				return `${imgHost}${url.replace(/^\/+/, '')}`;
			},
			normalizeLink(link) {
				if (!link) return '';
				let url = String(link).trim().replace(/\.vue(\?.*)?$/, '$1');
				if (url && url.charAt(0) !== '/') url = `/${url}`;
				return url;
			},
			openLink(url, isTab = false) {
				const openUrl = this.normalizeLink(url);
				const openMethod = isTab ? 'switchTab' : 'navigateTo';
				uni[openMethod]({
					url: openUrl,
					fail: (err) => {
						const fallbackMethod = isTab ? 'reLaunch' : 'redirectTo';
						uni[fallbackMethod]({
							url: openUrl,
							fail: () => {
								uni.showToast({
									title: err.errMsg || '页面跳转失败',
									icon: 'none'
								});
							}
						});
					}
				});
			},
			getInit() {
				getBottomNavigationApi().then((res)=>{
					this.obj=res.data
					this.$store.commit('BottomNavigationIsCustom', this.obj.isCustom == 1 ? true : false);
					if (this.obj.isCustom==1) {
						uni.hideTabBar()
					} else {
						uni.showTabBar()
					}
				})
			},
			goRouter(item) {
				var pages = getCurrentPages();
				var page = (pages[pages.length - 1]).$page.fullPath;
				const link = this.normalizeLink(item.link);
				if (link == page) return
				if (['/pages/index/index', '/pages/goods_cate/goods_cate',
						'/pages/order_addcart/order_addcart', '/pages/user/index'
					].indexOf(link) > -1) {
					this.openLink(link, true);
				} else {
					this.openLink(link);
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.unchecked {
		color: #333;
		font-size: 24rpx;
	}

	.page-footer {
		position: fixed;
		bottom: 0;
		z-index: 666;
		display: flex;
		align-items: center;
		justify-content: space-around;
		width: 100%;
		height: calc(98rpx+ constant(safe-area-inset-bottom)); ///兼容 IOS<11.2/
		height: calc(98rpx + env(safe-area-inset-bottom)); ///兼容 IOS>11.2/
		box-sizing: border-box;
		border-top: solid 1rpx #F3F3F3;
		background-color: #fff;
		box-shadow: 0px 0px 17rpx 1rpx rgba(206, 206, 206, 0.32);
		padding-bottom: constant(safe-area-inset-bottom); ///兼容 IOS<11.2/
		padding-bottom: env(safe-area-inset-bottom); ///兼容 IOS>11.2/

		.foot-item {
			display: flex;
			width: max-content;
			align-items: center;
			justify-content: center;
			flex-direction: column;
			position: relative;

			.count-num {
				position: absolute;
				display: flex;
				justify-content: center;
				align-items: center;
				width: 40rpx;
				height: 40rpx;
				top: 0rpx;
				right: -15rpx;
				color: #fff;
				font-size: 20rpx;
				background-color: #FD502F;
				border-radius: 50%;
				padding: 4rpx;
			}
		}

		.foot-item image {
			height: 50rpx;
			width: 50rpx;
			text-align: center;
			margin: 0 auto;
		}

		.foot-item .nav-icon {
			width: 50rpx;
			height: 50rpx;
			line-height: 50rpx;
			text-align: center;
			margin: 0 auto;
			font-size: 44rpx;
			color: #666;
		}

		.foot-item .nav-icon.checked {
			@include main-color(theme);
		}

		.foot-item .nav-category-icon {
			width: 50rpx;
			height: 50rpx;
			margin: 0 auto;
			display: grid;
			grid-template-columns: repeat(2, 16rpx);
			grid-template-rows: repeat(2, 16rpx);
			gap: 6rpx;
			align-content: center;
			justify-content: center;
			color: #666;
		}

		.foot-item .nav-category-icon view {
			width: 16rpx;
			height: 16rpx;
			border: 3rpx solid currentColor;
			border-radius: 3rpx;
			box-sizing: border-box;
		}

		.foot-item .nav-category-icon.checked {
			@include main-color(theme);
		}

		.txtchecked {
			font-size: 24rpx;
		}

		.foot-item .txt {
			font-size: 24rpx;
			@include main-color(theme);
		}
	}
</style>
