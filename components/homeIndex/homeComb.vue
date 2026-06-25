<template>
	<view class="page_count tui-skeleton" :data-theme="theme">
		<view class="bg-img" :style="{'background-image': bgColor}">
			<block v-for="(item,index) in banner" :key="index">
				<img :src="item.img" alt="" v-show="index == swiperCur">
			</block>
			<view class="maskBg" :style="[maskBgStyle]"></view>
		</view>
		<view :class="{scrolled:isScrolled, 'my-main': true}" :style="{ height: myMainHeight+'px' }">
			<!-- #ifdef H5 -->
			<view class="header">
				<view class="serch-wrapper acea-row">
					<view v-if="logoConfig" class="logo skeleton-rect">
						<image :src="logoUrl" mode="scaleToFill"></image>
					</view>
					<navigator v-if="hotWords.length > 0" :url="'/pages/goods/goods_search/index?searchVal='+searchVal"
						:style="[searchBoxStyle]" :class="logoConfig ? 'input' : 'uninput'" hover-class="none"
						class="input">
						<view class='swiperTxt'>
							<swiper :indicator-dots="indicatorDots" :autoplay="true" :interval="interval"
								:duration="duration" vertical="true" circular="true" @change="textChange">
								<block v-for="(item,index) in hotWords" :key='index'>
									<swiper-item catchtouchmove='catchTouchMove'>
										<view class=''>
											<view class='text'>
												<view class='newsTitle line1'><text
														class="iconfont icon-sousuo"></text><text>{{item.val}}</text>
												</view>
											</view>
										</view>
									</swiper-item>
								</block>
							</swiper>
						</view>
					</navigator>
					<navigator v-else :style="[searchBoxStyle]" :class="logoConfig ? 'input' : 'uninput'"
						url="/pages/goods/goods_search/index" class="input" hover-class="none">
						<text class="iconfont icon-sousuo8"></text>
						<text class="line1">{{placeWords}}</text>
					</navigator>
				</view>
			</view>
			<!-- #endif -->
			<!-- #ifdef MP || APP-PLUS -->
			<view class="mp-header">
				<view class="sys-head" :style="{ height: `${isSmallPage?0:statusBarHeight}px`}"></view>
				<view class="serch-box" :style="{ 'margin-top': `${searchTop}px`,'height': `${searchHeight}px`}">
					<view class="serch-wrapper acea-row">
						<view v-if="logoConfig" class="logo tui-skeleton-rect">
							<image :src="logoUrl" mode="scaleToFill"></image>
						</view>
						<navigator v-if="hotWords.length > 0"
							:url="'/pages/goods/goods_search/index?searchVal='+searchVal" :style="[searchBoxStyle]"
							hover-class="none" class="input" :class="logoConfig&&!isSmallPage ? 'input' : 'uninput'">
							<view class='swiperTxt'>
								<swiper :indicator-dots="indicatorDots" :autoplay="true" :interval="interval"
									:duration="duration" vertical="true" circular="true" @change="textChange">
									<block v-for="(item,index) in hotWords" :key='index'>
										<swiper-item catchtouchmove='catchTouchMove'>
											<view class='acea-row row-between-wrapper text-box'>
												<view class='text'>
													<view class='newsTitle line1'><text
															class="iconfont icon-sousuo"></text><text>{{item.val}}</text>
													</view>
												</view>
											</view>
										</swiper-item>
									</block>
								</swiper>
							</view>
						</navigator>
						<navigator v-else :style="[searchBoxStyle]" :class="logoConfig ? 'input' : 'uninput'"
							url="/pages/goods/goods_search/index" class="input" hover-class="none">
							<text class="iconfont icon-sousuo8"></text>
							<text class="line1">{{placeWords}}</text>
						</navigator>
					</view>
				</view>
			</view>
			<!-- #endif -->
			<view v-if="tabShowConfig" class="navTabBox tabNav tui-skeletonpictrue acea-row" :style="'top:'+isTop">
				<view class="longTab">
					<scroll-view scroll-x="true" style="white-space: nowrap; display: flex;" scroll-with-animation
						:scroll-left="tabLeft" show-scrollbar="true">
						<view class="longItem" :data-index="index" v-for="(item,index) in tabList" :key="index"
							:id="'id'+index" @click="longClick(index,item)"
							:class="tabClick === index? 'navChecked':''">
							<view class="acea-row row-middle">
								<view class="name tui-skeleton-rect">{{item.title}}</view>
								<view class="underlineBox" v-if="index===tabClick">
								</view>
							</view>
						</view>

					</scroll-view>
				</view>
				<view class="category">
					<text v-if="isShow" class="iconfont icon-xiangshang" @click="isShow=false"></text>
					<text v-if="!isShow" class="iconfont icon-xiangxia" @click="isShow=true"></text>
				</view>
			</view>
			<view v-if="isShow" class="navChangeBox" catchtouchmove="true" :style="'top:'+isTop">
				<view class="navChange">
					<block v-for="(item,index) in tabList" :key="index">
						<view class="titleBox">
							<text :class="tabClick === index ? 'checkColor' : 'textColor' " class="title line1"
								:id="'id'+index" @click="longClick(index,item)">{{item.title}}</text>
						</view>
					</block>
				</view>
				<view class="mask" @touchmove.prevent :hidden="!isShow" @click="isShow=false"></view>
			</view>
		</view>

		<view class="swiperBg" :style="{ marginTop: swiperTop+'px'}">
			<view class="swiper page_swiper" v-if="navIndex === 0">
				<swiper :autoplay="true" :circular="circular" :interval="intervalBanner" :duration="duration"
					:previous-margin="swiperType==0?'30rpx':''" :next-margin="swiperType==0?'30rpx':''"
					:current="swiperCur" @change="swiperChange">
					<block v-for="(item,index) in banner" :key="index">
						<swiper-item :style="[contentStyleBanner]" :class="{ active: index == swiperCur }"
							class="scalex">
							<view @click="menusTap(item.info[1].value)"
								class='slide-navigator acea-row row-between-wrapper tui-skeleton-rect'
								:class="swiperType==0?'row-between-wrapper-1':'row-between-wrapper-2'">
								<image mode="aspectFill" :style="[contentStyleBanner]" :src="item.img"
									class="slide-image aa"></image>
							</view>
						</swiper-item>
					</block>
				</swiper>
				<view v-if="docType === 0" class="dots" :style="[dotStyle]">
					<block v-for="(item,index) in banner" :key="index">
						<view class="dot-item"
							:style="{'background-color': swiperCur === index ? (dataConfig.themeStyleConfig.tabVal?dataConfig.docColor.color[0].item:themeColor)  : ''}">
						</view>
					</block>
				</view>
				<view v-if="docType === 1" class="dots" :style="[dotStyle]">
					<block v-for="(item,index) in banner" :key="index">
						<view class="dot"
							:style="{'background-color': swiperCur === index ? (dataConfig.themeStyleConfig.tabVal?dataConfig.docColor.color[0].item:themeColor)  : ''}">
						</view>
					</block>
				</view>
			</view>
		</view>

	</view>
</template>

<script>
	let app = getApp();
	import {
		goPage
	} from '@/libs/iframe.js'
	export default {
		name: 'homeComb',
		props: {
			dataConfig: {
				type: Object,
				default: () => {}
			},
			navIndex: {
				type: Number,
				default: 0
			},
			isScrolled: {
				type: Boolean,
				default: false
			},
			isSmallPage: {
				type: Boolean,
				default: false
			},
			bgInfo: {
				type: Object,
				default: () => {}
			},
		},
		data() {
			return {
				myMainHeight: 0, //澶撮儴tab鍒囨崲椤靛拰鎼滅储鎸夐挳鐨勯珮搴﹀拰
				indicatorDots: false,
				circular: true,
				autoplay: false,
				duration: 500,
				swiperTop: 0,
				statusBarHeight: app.globalData.statusBarHeight, //鎵嬫満绔ご閮ㄦ樉绀烘椂闂翠綅缃殑楂樺害
				swiperCur: 0,
				tabClick: 0, //瀵艰埅鏍忚鐐瑰嚮
				isLeft: 0, //瀵艰埅鏍忎笅鍒掔嚎浣嶇疆
				isWidth: 0, //姣忎釜瀵艰埅鏍忓崰浣?
				mainWidth: app.globalData.mainWidth,
				theme: app.globalData.theme,
				tabLeft: 0,
				bgColor: '',
				isTop: 0,
				navHeight: 0,
				isShow: false,
				marTop: 0,
				searchVal: '',
				intervalBanner: 2500,
				themeColor:this.$options.filters.filterTheme(app.globalData.theme),
				searchTop:0,
				searchRight:0,
				searchHeight:0,
				statusWidth:0,
			};
		},
		watch: {
			banner: {
				handler(val) {
					this.bgColor = val[0].img;
				},
				immediate: true
			},
		},
		computed: {
			tabShowConfig() {
				return this.dataConfig.tabShowConfig.tabVal == 0;
			},
			placeWords() {
				return this.dataConfig.placeWords.val;
			},
			interval() {
				return this.dataConfig.titleConfig.val * 1000
			},
			docType() {
				return this.dataConfig.docConfig.tabVal
			},
			swiperType() {
				return this.dataConfig.swiperStyleConfig.tabVal
			},
			hotWords() {
				return this.dataConfig.hotWords.list
			},
			lineColor() {
				return {
					backgroundColor: this.dataConfig.checkColor.color[0].item
				}
			},
			maskBgStyle() {
				return {
					background: this.bgInfo.isBgColor=='1' ?
						`linear-gradient(180deg, rgba(245, 245, 245, 0) 0%, ${this.bgInfo.colorPicker} 100%)` :
						`linear-gradient(180deg, rgba(245, 245, 245, 0) 0%, #f5f5f5 100%)`,
				}
			},
			logoConfig() {
				return this.dataConfig.logoConfig.url && this.dataConfig.searConfig.tabVal === 1
			},
			logoUrl() {
				if (this.isScrolled && this.dataConfig.logoFixConfig.url) {
					return this.dataConfig.logoFixConfig.url
				} else {
					return this.dataConfig.logoConfig.url
				}
			},
			textColor() {
				return this.dataConfig.fontColor.color[0].item;
			},
			tabList() {
				let tabList = this.dataConfig.listConfig.list;
				tabList.unshift({
					title: '棣栭〉',
					type: 2,
					val: 0
				})
				return tabList
			},
			banner() {
				return this.dataConfig.swiperConfig.list
			},
			searchBoxStyle() {
				return {
					borderRadius: this.dataConfig.contentStyle.val ? this.dataConfig.contentStyle.val + 'px' : '0',
					backgroundColor: this.dataConfig.borderColor.color[0].item,
					color: this.dataConfig.textColor.color[0].item,
					textAlign: this.dataConfig.textPosition.list[this.dataConfig.textPosition.tabVal].style,
					// #ifdef MP
					height:this.searchHeight + 'px',
					flex:!this.isSmallPage?1:'',
					marginRight:!this.isSmallPage?(this.statusWidth + this.searchRight+'px'):'',
					// #endif
				}
			},
			dotStyle() {
				return {
					padding: '0 40rpx',
					justifyContent: this.dataConfig.txtStyle.tabVal === 1 ? 'center' : this.dataConfig.txtStyle
						.tabVal === 2 ? 'flex-end' : 'flex-start'
				}
			},
			contentStyleBanner() {
				return {
					'borderRadius': this.dataConfig.contentStyleBanner.val ? this.dataConfig.contentStyleBanner
						.val + 'px' : '0'
				}
			},
		},
		created() {
			// #ifdef MP || APP-PLUS
			this.isTop = (this.isSmallPage ? 0 : this.statusBarHeight) + 48 + 'px' //鍒嗙被鐨則op鍊?
			if (!this.tabShowConfig) {
				this.myMainHeight = (this.isSmallPage ? 0 : this.statusBarHeight) + 40 + 10; //澶撮儴tab鍒囨崲椤靛拰鎼滅储鎸夐挳鐨勯珮搴﹀拰锛?0鏄笅杈硅窛
			} else {
				this.myMainHeight = (this.isSmallPage ? 0 : this.statusBarHeight) + 40 + 42; //澶撮儴tab鍒囨崲椤靛拰鎼滅储鎸夐挳鐨勯珮搴﹀拰
			}
			// #endif
			
			// #ifdef MP
			const res = uni.getMenuButtonBoundingClientRect()
			const statusHeight = res.top //鑳跺泭璺濈椤堕儴
			const statusRight = res.right //鑳跺泭鍙宠竟鐣屽潗鏍?
			const jnHeight = res.height //鑳跺泭楂樺害
			this.statusWidth= res.width
			this.searchTop=statusHeight-this.statusBarHeight
			this.searchHeight=jnHeight
			uni.getSystemInfo({
				success:res=>{
					this.searchRight=res.windowWidth-statusRight
				}
			})
			// #endif

			// #ifdef H5
			this.isTop = 0
			this.myMainHeight = 'auto';

			// #endif

			this.isWidth = (this.mainWidth - 65) / 4;
			setTimeout((e) => {
				const query = uni.createSelectorQuery().in(this);
				query.select('.header').boundingClientRect(res => {
					if (res) this.marTop = res.height //澶撮儴鐨勯珮搴?
				}).exec();

				if (!this.tabShowConfig) {
					query.select('.swiperBg').boundingClientRect(res => {
						// #ifdef H5
						this.swiperTop = this.navHeight + this.marTop + this.statusBarHeight +
							4; //杞挱鍥剧殑top鍊?
						// #endif
						// #ifndef H5
						if (this.isSmallPage) {
							this.swiperTop = this.statusBarHeight; //杞挱鍥剧殑top鍊?
						} else {
							this.swiperTop = this.statusBarHeight + 48; //杞挱鍥剧殑top鍊?
						}
						// #endif
					}).exec();
				} else {
					query.select('.navTabBox').boundingClientRect(data => {
						this.navHeight = data.height //鍏冪礌navHeight鐨勯珮搴?
						// #ifdef H5
						this.swiperTop = this.navHeight + this.marTop + this.statusBarHeight +
							4; //杞挱鍥剧殑top鍊?
						// #endif
						// #ifndef H5
						if (this.isSmallPage) {
							this.swiperTop = 85; //杞挱鍥剧殑top鍊?
						} else {
							this.swiperTop = this.statusBarHeight + 85; //杞挱鍥剧殑top鍊?
						}
						// #endif
					}).exec();
				}

			}, 200)
		},
		methods: {
			menusTap(url) {
				this.$util.navigateTo(url);
			},
			swiperChange(e) {
				let {
					current,
					source
				} = e.detail;
				if (source === 'autoplay' || source === 'touch') {
					this.swiperCur = e.detail.current;
					this.bgColor = this.banner[e.detail.current]['img']
				}
			},
			textChange(e) {
				let {
					current,
					source
				} = e.detail;
				if (source === 'autoplay' || source === 'touch') {
					this.searchVal = this.hotWords[e.detail.current]['val']
				}
			},
			longClick(index, item) {
				this.tabClick = index; //璁剧疆瀵艰埅鐐瑰嚮浜嗗摢涓€涓?
				this.$nextTick(() => {
					let id = 'id' + index;
					this.tabLeft = (index - 2) * this.isWidth //璁剧疆涓嬪垝绾夸綅缃?
					this.$emit('changeTab', index, item);
				})
			},
			parentEmit(id, index) {
				this.$emit('changeTab', id, index);
			}
		}
	}
</script>

<style lang="scss" scoped>
	.uninput {
		/* #ifdef MP */
		width: 510rpx !important;
		/* #endif */
		/* #ifndef MP */
		width: 100% !important;
		/* #endif */
	}

	.icon-sousuo8 {
		font-size: 15px;

	}

	.bgwhite {
		background-color: #fff !important;
	}

	.mask {
		z-index: 999;
		top: 260rpx;
	}

	.navChangeBox {
		position: relative;
	}

	.navChange {
		background-color: #fff;
		position: absolute;
		z-index: 999999;
		width: 100%;
		border-radius: 0px 0px 16rpx 16rpx;
		padding: 24rpx 20rpx;
		display: grid;
		grid-template-rows: auto;
		grid-template-columns: repeat(5, 1fr);
		grid-column-gap: 10rpx;
		grid-row-gap: 20rpx;

		.nobg {
			background-color: #fff !important;
		}

		.titleBox {
			height: 58rpx;
			background: #F2F2F2;
			border-radius: 8rpx;
			text-align: center;
		}

		.title {
			margin: 0 auto;
			display: inline-block;
			width: 118rpx;
			height: 58rpx;
			line-height: 58rpx;
			text-align: center;

			opacity: 1;
			color: #333333;
			font-size: 24rpx;
		}

		.titleBox:nth-child(5n) {
			margin-right: 0;
		}

		.titleBox:last-child {
			margin-bottom: 0;
		}

		.changed {
			border-radius: 8rpx;
			@include cate-two-btn(theme);
			@include coupons_border_color(theme);

			.title {
				@include main_color(theme);
			}
		}
	}

	.row-middle {
		flex-direction: column;
	}

	.navTabBox {
		width: 100%;
		height: 66rpx;
		color: rgba(255, 255, 255, 1);
		position: relative;
		padding: 0 24rpx 0 24rpx;
		display: flex;
		justify-content: space-between;
		z-index: 9;

		&.isFixed {
			z-index: 10;
			position: fixed;
			left: 0;
			width: 100%;
			top: 0;
		}

		.click {
			color: white;
		}

		.longTab {
			width: 94%;

			.longItem {
				display: inline-block;
				text-align: center;
				font-size: 28rpx;
				color: #fff;
				white-space: nowrap;
				text-overflow: ellipsis;
				margin-right: 42rpx;

				&.click {
					font-weight: bold;
					font-size: 30rpx;
					color: #fff;
					font-weight: bold;
				}

				.name {
					height: 48rpx;
				}
			}

			.underlineBox {
				margin-top: 8rpx;
				height: 3px;
				transition: .5s;

				.underline {
					width: 33rpx;
					height: 4rpx;
				}
			}
		}

		.category {
			height: 66rpx;
			line-height: 46rpx;
			z-index: 3;

			.iconfont {
				font-size: 24rpx;
			}
		}
	}


	.swiperBg {
		z-index: 1;
		margin-top: 10rpx;

		.colorBg {
			position: absolute;
			left: 0;
			top: 0;
			height: 130rpx;
			width: 100%;
		}

		.page_swiper {
			position: relative;
			width: 100%;
			height: auto;
			margin: 0 auto;
			border-radius: 10rpx;
			overflow: hidden;
			z-index: 8;
			padding:  0rpx 20rpx 0rpx;

			image {
				width: 100%;
				height: 310rpx;
				margin: 0 auto;
				border-radius: 10rpx;
			}

			.acea-row.row-between-wrapper {
				height: 310rpx;
				margin: 0 auto;
				border-radius: 10rpx;
			}

			.acea-row.row-between-wrapper-1 {
				width: 100%;
			}

			.acea-row.row-between-wrapper-2 {
				width: 97%;
			}

			swiper {
				width: 100%;
				display: block;
				height: 310rpx;

				&.scalex {
					/deep/.uni-swiper-slide-frame {
						transform: translate(0, 0) !important;
					}
				}
			}

			image {
				transform: scale(0.96);
				transition: all 0.6s ease;
			}

			/deep/ swiper-item.active {
				image {
					transform: scale(1);
				}
			}

			.dots {
				display: flex;
				flex-direction: row;
				position: absolute;
				bottom: 40rpx;
				align-items: center;
				width: 100%;
			}

			.dot-item {
				width: 10rpx;
				height: 10rpx;
				background-color: rgba(255, 255, 255, .4);
				border-radius: 50%;
				margin: 0 6rpx;
			}

			.dot {
				width: 16rpx;
				height: 6rpx;
				border-radius: 6rpx;
				margin-right: 6rpx;
				background-color: rgba(255, 255, 255, .4);
			}
		}
	}

	.scrolled {
		z-index: 5000;
		position: fixed;
		left: 0;
		top: 0;
		width: 100%;
		background-color: #fff !important;
		color: #000 !important;
		transition: background-color .5s ease;

		.longItem,
		.click,
		.category text {
			color: #000 !important;
		}

		.btn .iconfont {
			color: #333 !important;
		}

		.iconnum {
			background: #333 !important;
		}

		.underline {
			background: #000 !important;
		}

		.click {
			&::after {
				background-color: #fff !important;
			}
		}

		.input,
		.uninput {

			background-color: #eee !important;
		}
	}

	.page_count {
		position: relative;
		overflow: hidden;
		background-repeat: no-repeat;


		.bg-img {
			position: absolute;
			width: 100%;
			height: 100%;
			top: 0;
			z-index: 0;
			filter: blur(0);
			overflow: hidden;

			img {
				width: 100%;
				height: 100%;
				filter: blur(30rpx);
				transform: scale(1.5);
			}

			.maskBg {
				position: absolute;
				bottom: 0;
				width: 100%;
				height: 136px;
				background: linear-gradient(180deg, rgba(245, 245, 245, 0) 0%, #f5f5f5 100%);
			}
		}
	}

	.my-main {
		left: 0;
		position: fixed;
		top: 0;
		width: 100%;
		z-index: 30;
		transition: background-color .5s ease;
	}

	.page_count {

		.header {
			width: 100%;
			padding: 24rpx;

			.serch-wrapper {
				align-items: center;

				.logo {
					width: 118rpx;
					margin-right: 24rpx;
				}

				image {
					width: 118rpx;
					height: 42rpx;
				}

				.input {
					display: flex;
					align-items: center;
					width: 546rpx;
					height: 55rpx;
					padding-left: 20rpx;
					font-size: 26rpx;
					padding-right: 4rpx;
					box-sizing: border-box;

					.iconfont {
						margin-right: 4rpx;
						font-size: 26rpx;
						color: #666666;
					}
				}
			}

			.tabNav {
				padding-top: 24rpx;
			}
		}

		/* #ifdef MP || APP-PLUS */
		.mp-header {
			z-index: 999;
			position: fixed;
			left: 0;
			top: 0;
			width: 100%;
			padding-bottom: 20rpx;

			.serch-wrapper {
				height: 100%;
				align-items: center;
				padding: 0 24rpx 0 24rpx;

				image {
					width: 118rpx;
					height: 42rpx;
					margin-right: 30rpx;
				}

				.input {
					display: flex;
					align-items: center;
					width: 546rpx;
					flex: 1;
					height: 50rpx;
					padding-left: 20rpx;
					font-size: 28rpx;
					box-sizing: border-box;

					.iconfont {
						margin-right: 20rpx;
					}
				}
			}
		}

		.swiperTxt {
			width: 100%;
			height: 100%;
			line-height: 52rpx;
			overflow: hidden;
		}

		.swiperTxt .text {
			width: 100%;

		}

		.swiperTxt .text .label {
			font-size: 20rpx;
			color: #ff4c48;
			width: 64rpx;
			height: 30rpx;
			border-radius: 40rpx;
			text-align: center;
			line-height: 28rpx;
			border: 2rpx solid #ff4947;
		}

		.swiperTxt .text .newsTitle {
			font-size: 24rpx;
		}

		.swiperTxt swiper {
			height: 100%;
		}
		/* #endif */
	}

	.navChecked {
		font-size: 32rpx !important;
		font-weight: 500;
	}

	.checkColor {
		@include main_color(theme);
	}
	.text-box{
		height: 100%;
	}
</style>
