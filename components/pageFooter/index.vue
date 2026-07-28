<template>
	<!-- 底部导航 -->
	<view :data-theme="theme">
		<view v-if="obj.isCustom==1">
			<view class="page-footer" id="target">
				<view class="foot-item" :class="{'foot-item-center': index === 2}" v-for="(item,index) in obj.bottomNavigationList" :key="index"
					@click="goRouter(item)">
					<block v-if="isActive(item)">
						<view v-if="index === 2" class="nav-cost-icon checked">
							<view class="nav-cost-text"><text>透明</text><text>修车</text></view>
						</view>
						<view v-else-if="fixedIcons[index] && fixedIcons[index].type === 'category'" class="nav-category-icon checked">
							<view></view><view></view><view></view><view></view>
						</view>
						<text v-else class="iconfont nav-icon checked" :class="fixedIcons[index] || fixedIcons[0]"></text>
						<view class="txt">{{item.name}}</view>
					</block>
					<block v-else>
						<view v-if="index === 2" class="nav-cost-icon">
							<view class="nav-cost-text"><text>透明</text><text>修车</text></view>
						</view>
						<view v-else-if="fixedIcons[index] && fixedIcons[index].type === 'category'" class="nav-category-icon">
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
				let link = this.normalizeLink(item.link);
				if (link.split('?')[0] === '/pages/goods_cate/goods_cate' && link.indexOf('productType=') === -1) {
					link += (link.indexOf('?') > -1 ? '&' : '?') + 'productType=7';
				}
				if (link == page) return
				if (['/pages/index/index', '/pages/order_addcart/order_addcart', '/pages/user/index'
					].indexOf(link.split('?')[0]) > -1) {
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
		background: #fff;
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
			color: #18b8ff;
		}

		.foot-item .nav-cost-icon {
			width: 126rpx;
			height: 126rpx;
			font-size: 24rpx;
			font-weight: 600;
			text-align: center;
			color: #fff;
			background:
				linear-gradient(180deg, #5e5b54 0%, #252525 100%) padding-box,
				conic-gradient(from 210deg, #32d8ff 0deg, #0aa9ff 120deg, #1978ff 235deg, #78ecff 360deg) border-box;
			border: 8rpx solid transparent;
			border-radius: 50%;
			box-sizing: border-box;
			margin-bottom: -50rpx;
			transform: translateY(-84rpx);
			box-shadow:
				0 0 8rpx rgba(50, 216, 255, 0.95),
				0 0 18rpx rgba(22, 183, 255, 0.68),
				0 0 30rpx rgba(22, 183, 255, 0.36),
				inset 0 0 8rpx rgba(50, 216, 255, 0.28);
			position: relative;
			z-index: 2;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			line-height: 1;
			letter-spacing: 0;
			gap: 8rpx;
			padding: 18rpx 10rpx 14rpx;
		}

		.foot-item .nav-cost-icon.checked {
			color: #fff;
		}

		.foot-item .nav-cost-car {
			width: 56rpx;
			height: 48rpx;
			flex-shrink: 0;
			display: block;
		}

		.foot-item .nav-cost-text {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-width: 0;
			color: #fff;
		}

		.foot-item .nav-cost-text text:first-child {
			font-size: 28rpx;
			line-height: 32rpx;
			font-weight: 700;
			color: #fff;
			white-space: nowrap;
		}

		.foot-item .nav-cost-text text:last-child {
			margin-top: 4rpx;
			font-size: 28rpx;
			line-height: 32rpx;
			font-weight: 700;
			color: #fff;
			white-space: nowrap;
		}

		.foot-item .nav-category-icon {
			width: 50rpx;
			height: 50rpx;
			margin: 0 auto;
			display: grid;
			grid-template-columns: repeat(2, 15rpx);
			grid-template-rows: repeat(2, 15rpx);
			gap: 7rpx;
			align-content: center;
			justify-content: center;
			color: #666;
		}

		.foot-item .nav-category-icon view {
			width: 15rpx;
			height: 15rpx;
			border: 4rpx solid currentColor;
			border-radius: 4rpx;
			box-sizing: border-box;
		}

		.foot-item .nav-category-icon.checked {
			color: #18b8ff;
		}

		.txtchecked {
			font-size: 24rpx;
			color: #18b8ff;
		}

		.foot-item .txt {
			font-size: 24rpx;
			color: #18b8ff;
		}

		.foot-item-center .txt,
		.foot-item-center .unchecked {
			position: absolute;
			top: 50rpx;
			left: 50%;
			transform: translateX(-50%);
			width: 120rpx;
			text-align: center;
			font-size: 24rpx;
			line-height: 28rpx;
		}
	}
</style>
