<template>
	<view id="home" :style="[pageStyle]" class="smallBox" :data-theme="theme">
		<!-- 缁勫悎缁勪欢 -->
		<homeComb v-if="showHomeComb" :bgInfo="bgInfo" :dataConfig="homeCombData" @changeTab="changeTab" :isScrolled="isScrolled" :isSmallPage="isSmallPage"
			:navIndex="navIndex"></homeComb>
		<!-- 椤堕儴鎼滅储妗?-->
		<headerSearch :isSmallPage="isSmallPage" v-if="showHeaderSerch" :dataConfig="headerSerchCombData"></headerSearch>
		<!-- 鍒嗙被瀵艰埅 -->
		<cateNav v-if="showCateNav" :dataConfig="cateNavData" @changeTab="changeTab"></cateNav>
		<view v-if="navIndex === 0">
			<block v-for="(item, index) in styleConfig" :key="index">
				<!-- 鏂伴椈绠€鎶?-->
				<news v-if="item.name == 'news'&&!item.isHide" :dataConfig="item"></news>
				<!-- menu -->
				<menus v-if="item.name == 'menus'&&!item.isHide" :dataConfig="item"></menus>
				<!-- 鏂囩珷鍒楄〃 -->
				<articleList v-if="item.name == 'homeArticle'&&!item.isHide" :dataConfig="item"></articleList>
				<!-- 绉掓潃 -->
				<seckill-data v-if="item.name == 'seckill'&&!item.isHide" :dataConfig="item"></seckill-data>
				<!-- 浼樻儬鍒?-->
				<coupon v-if="item.name == 'homeCoupons'&&!item.isHide" :dataConfig="item"></coupon>
				<!-- 鍥剧墖榄旀柟 -->
				<pictureCube v-if="item.name == 'pictureCube'&&!item.isHide" :dataConfig="item"></pictureCube>
				<!-- 鐑尯 -->
				<hotSpot v-if="item.name == 'homeHotspot'&&!item.isHide" :dataConfig="item"></hotSpot>
				<!-- 杞挱鍥?-->
				<swiperBg v-if="item.name == 'swiperBg'&&!item.isHide" :dataConfig="item"></swiperBg>
				<!-- 瑙嗛 -->
				<shortVideo v-if="item.name == 'video'&&!item.isHide" :dataConfig="item"></shortVideo>
				<!-- 杈呭姪绾?-->
				<guide v-if="item.name == 'guide'&&!item.isHide" :dataConfig="item"></guide>
				<!-- 瀵屾枃鏈?-->
				<rich-text-editor v-if="item.name == 'richTextEditor'&&!item.isHide" :dataConfig="item"></rich-text-editor>
				<!-- 杈呭姪绌虹櫧-->
				<blank-page v-if="item.name == 'blankPage'&&!item.isHide" :dataConfig="item"></blank-page>
				<!-- 鏍囬 -->
				<home-title v-if="item.name == 'titles'&&!item.isHide" :dataConfig="item"></home-title>
				<!-- 鎷煎洟 -->
				<group v-if="item.name == 'group'&&!item.isHide" :dataConfig="item"></group>
				<!-- 鐮嶄环 -->
				<bargain v-if="item.name == 'bargain'&&!item.isHide" :dataConfig="item"></bargain>
				<!-- 鍟嗗搧鍒楄〃 -->
				<goodList v-if="item.name == 'goodList'&&!item.isHide" :dataConfig="item" @detail="goDetail"></goodList>
				<!-- 閫夐」鍗″晢鍝佸垪琛?-->
				<homeTab v-if="item.name == 'homeTab'&&!item.isHide" :dataConfig="item" @detail="goDetail"></homeTab>
				<!-- 搴曢儴瀵艰埅-->
				<page-footer v-if="item.name == 'footer'&&!item.isHide" :dataConfig="item" :isSmallPage="isSmallPage"></page-footer>
			</block>
		</view>
		<!-- 鍒嗙被椤?-->
		<view class="productList" v-if="navIndex > 0 && sortList.length>0">
			<view class="sort acea-row" :class="sortList.length ? '' : 'no_pad'"
				:style="{ marginTop: sortMarTop + 'px' }">
				<navigator hover-class="none"
					:url="'/pages/goods/goods_list/index?cid=' + item.id + '&title=' + item.name" class="item"
					v-for="(item, index) in sortList" :key="index" v-if="index<9">
					<view class="pictrue">
						<!-- <easy-loadimage :image-src="item.icon" class='slide-image skeleton-rect'>
		          </easy-loadimage> -->
						<image :src="item.extra" class='slide-image tui-skeleton-rect'></image>
					</view>
					<view class="text">{{ item.name }}</view>
				</navigator>
				<view class="item" @click="bindMore()" v-if="sortList.length >= 9">
					<view class="pictrues acea-row row-center-wrapper">
						<text class="iconfont icon-gengduo2"></text>
					</view>
					<view class="text">鏇村</view>
				</view>
			</view>
		</view>
		<!-- 鎺ㄨ崘鍟嗗搧锛屽垎绫诲晢鍝佸垪琛?-->
		<recommend v-if="categoryId>0" ref="recommendIndex" :categoryId='categoryId' :isShowTitle="isShowTitle"
			@getRecommendLength="getRecommendLength"></recommend>
		<view class='noCommodity' v-if="isNoCommodity&& navIndex > 0">
			<view class='pictrue'>
				<image :src="urlDomain+'crmebimage/presets/noShopper.png'"></image>
			</view>
			<text class="text-ccc">鏆傛棤鍟嗗搧</text>
		</view>
		<!-- <view v-if="bottomNavigationIsCustom" class="footerBottom"></view> -->
	</view>
</template>
<script>
	import {
		pagediyInfoApi,
		getCategoryTwo
	} from '@/api/api.js';
	import {
		mapGetters
	} from "vuex";
	import tuiSkeleton from '@/components/base/tui-skeleton.vue';
	import homeComb from '@/pages/activity/components/homeIndex/homeComb';
	import seckillData from "@/pages/activity/components/homeIndex/seckill.vue";
	import coupon from "@/pages/activity/components/homeIndex/coupon.vue";
	import menus from "@/pages/activity/components/homeIndex/menus.vue";
	import pictureCube from '@/pages/activity/components/homeIndex/pictureCube'
	import news from '@/pages/activity/components/homeIndex/news'
	import goodList from '@/pages/activity/components/homeIndex/goodList'
	import guide from '@/pages/activity/components/homeIndex/guide';
	import articleList from '@/pages/activity/components/homeIndex/articleList'
	import swiperBg from '@/pages/activity/components/homeIndex/swiperBg'
	import headerSearch from '@/pages/activity/components/homeIndex/headerSearch';
	import cateNav from '@/pages/activity/components/homeIndex/cateNav';
	import richTextEditor from '@/pages/activity/components/homeIndex/richTextEditor';
	import shortVideo from '@/pages/activity/components/homeIndex/video';
	import homeTab from '@/pages/activity/components/homeIndex/homeTab';
	import blankPage from '@/pages/activity/components/homeIndex/blankPage';
	import homeTitle from '@/pages/activity/components/homeIndex/title';
	import pageFooter from '@/pages/activity/components/homeIndex/pageFoot';
	import recommend from "@/components/base/recommend.vue";
	import group from "@/pages/activity/components/homeIndex/group.vue";
	import hotSpot from '@/pages/activity/components/homeIndex/hotSpot.vue';
	import bargain from "@/pages/activity/components/homeIndex/bargain.vue";
	import {
		goProductDetail
	} from "../../../libs/order";
	let app = getApp();
	export default {
		data() {
			return {
				urlDomain: this.$Cache.get("imgHost"),
				theme: app.globalData.theme,
				isSmallPage: true, //鏄惁鏄井椤甸潰锛宼rue鏄紝false涓嶆槸
				styleConfig: [],
				bgColor: '',
				bgPic: '',
				bgTabVal: '',
				isFixed: true,
				storeHeight: 0,
				smallPage: false,
				homeCombData: {},
				headerSerchCombData: {},
				sortList: [],
				sortMarTop: 0,
				showCateNav: false, //鏄惁鏄剧ず鍒嗙被瀵艰埅缁勪欢
				cateNavData: {}, //鍒嗙被瀵艰埅缁勪欢鏁版嵁
				navIndex: 0,
				pageStyle: null,
				cateNavActive: 0,
				categoryId: 0, //鍒嗙被id
				diyId: 0, //diyid
				isNoCommodity: false,
				showHomeComb: false,
				showHeaderSerch: false,
				domOffsetTop: 50,
				isScrolled: false,
				bgInfo:{
					colorPicker:'#f5f5f5',
					isBgColor:1,
				},
			}
		},
		components: {
			homeComb,
			tuiSkeleton,
			seckillData,
			coupon,
			menus,
			pictureCube,
			news,
			goodList,
			articleList,
			swiperBg,
			headerSearch,
			cateNav,
			guide,
			richTextEditor,
			shortVideo,
			homeTab,
			blankPage,
			homeTitle,
			pageFooter,
			recommend,
			group,
			hotSpot,
			bargain
		},
		computed: mapGetters(['bottomNavigationIsCustom']),
		onLoad(options) {
			if (options.scene) {
				let value = this.$util.getUrlParams(decodeURIComponent(options.scene));
				if (value.id) this.diyId = Number(value.id);
			}
			if (options.id) {
				this.diyId = Number(options.id);
			}
			this.diyData(this.diyId)
		},
		// 婊氬姩鐩戝惉
		onPageScroll(e) {
			// 浼犲叆scrollTop鍊煎苟瑙﹀彂鎵€鏈塭asy-loadimage缁勪欢涓嬬殑婊氬姩鐩戝惉浜嬩欢
			uni.$emit('scroll');
			if (e.scrollTop > this.domOffsetTop) {
				this.isScrolled = true;
			}
			if (e.scrollTop < this.domOffsetTop) {
				this.$nextTick(() => {
					this.isScrolled = false;
				});
			}
		},
		methods: {
			diyData(id) {
				let that = this;
				that.styleConfig = [];
				uni.showLoading({
					title: '鍔犺浇涓?..'
				});
				pagediyInfoApi(id).then(res => {
					uni.setNavigationBarTitle({
						title: res.data.title
					});
					uni.setNavigationBarColor({
						//蹇呴』瑕?6杩涘埗灏忓啓
						frontColor: res.data.titleColor,
						backgroundColor: res.data.titleBgColor.toString().toLowerCase(),
					})
					let data = res.data;
					this.bgInfo.isBgColor=data.isBgColor
					this.bgInfo.colorPicker=data.colorPicker
					that.styleConfig = that.$util.objToArr(res.data.value);
					uni.hideLoading();
					that.styleConfig.forEach((item) => {
						if (item.name == 'tabNav'&&!item.isHide) {
							this.showCateNav = true;
							this.cateNavData = item;
						}
						if (item.name === 'homeComb'&&!item.isHide) {
							that.showHomeComb = true
							that.homeCombData = item;
						}
						if (item.name === 'headerSerch'&&!item.isHide) {
							that.showHeaderSerch = true
							that.headerSerchCombData = item;
						}
					});
					this.pageStyle = {
						'background-color': data.isBgColor === 1 ? res.data.colorPicker : '',
						'background-image': data.isBgPic === 1 ? `url(${res.data.bgPic})` : '',
						'background-repeat': res.data.bgTabVal === 1 ? 'repeat-y' : 'no-repeat',
						'background-size': res.data.bgTabVal === 2 ? 'cover' : 'contain'
					};
					setTimeout(() => {
						this.isNodes++;
					}, 100);
				}).catch(err => {
					return that.$util.Tips({
						title: err
					});
					uni.hideLoading();
				})
			},
			getRecommendLength(e) {
				this.isNoCommodity = e == 0 ? true : false;
			},
			// 鍒嗙被鍒囨崲鐐瑰嚮
			changeTab(index, item) {
				//type=0寰〉闈紝1鍒嗙被锛?棣栭〉
				this.cateNavActive = index;
				if (item.type == 1) {
					this.navIndex = 1;
					if (!item.val) {
						this.sortList = [];
						this.categoryId = 0;
						this.$util.Tips({
                            title: "请在平台端选择商品分类！确保加载商品分类数据。"
						});
						return;
					} else {
						getCategoryTwo(item.val).then(res => {
							this.sortList = res.data;
							// #ifdef H5
							self.sortMarTop = 10;
							// #endif
						});
						this.categoryId = item.val;
						this.isShowTitle = false;
					}
				} else if (item.type == 0) {
					this.navIndex = 0;
					this.isShowTitle = true;
					this.categoryId = 0;
					if (!item.val) {
						return this.$util.Tips({
                            title: "请在平台端选择微页面链接！确保加载微页面数据。"
						});
					} else {
						this.styleConfig = [];
						this.diyData(item.val, true);
					}
				} else {
					this.categoryId = 0;
					this.navIndex = 0;
					this.styleConfig = [];
					this.diyData(this.diyId, false);
				}
			},
			// 鍘诲晢鍝佽鎯呴〉
			goDetail(item) {
				goProductDetail(item.id, 0, '')
			},
			bindMore(){
				uni.switchTab({
					url: `/pages/goods_cate/goods_cate`
				})
			}
		},
	}
</script>

<style lang="scss" scoped>
	.smallBox {
		padding-bottom: calc(130rpx+ constant(safe-area-inset-bottom)); ///鍏煎 IOS<11.2/
		padding-bottom: calc(130rpx + env(safe-area-inset-bottom)); ///鍏煎 IOS>11.2/
	}

	.productList {
		background-color: #F5F5F5;
		margin-top: 20rpx;

		.sort {
			width: 710rpx;
			max-height: 380rpx;
			background: rgba(255, 255, 255, 1);
			border-radius: 16rpx;
			padding: 0rpx 0rpx 20rpx 0rpx !important;
			flex-wrap: wrap;
			margin: 25rpx auto 0 auto;

			&.no_pad {
				padding: 0;
			}

			.item {
				width: 20%;
				margin-top: 20rpx;
				text-align: center;

				.pictrues {
					width: 90rpx;
					height: 90rpx;
					background: #F5F5F5;
					border-radius: 50%;
					margin: 0 auto;
				}

				.pictrue {
					width: 90rpx;
					height: 90rpx;
					background: #F5F5F5;
					border-radius: 50%;
					margin: 0 auto;
				}

				.slide-image {
					width: 90rpx;
					height: 90rpx;
					border-radius: 50%;
					overflow: hidden;
				}

				/deep/ .easy-loadimage,
				uni-image,
				.easy-loadimage {
					width: 90rpx;
					height: 90rpx;
					display: inline-block;
				}

				.text {
					color: #272727;
					font-size: 24rpx;
					margin-top: 10rpx;
					white-space: nowrap;
					text-overflow: ellipsis;
				}
			}
		}
	}

	.productList .list.on {
		background-color: #fff;
		border-top: 1px solid #f6f6f6;
	}

	.productList .list .item {
		width: 345rpx;
		margin-top: 20rpx;
		background-color: #fff;
		border-radius: 10rpx;

		.name {
			display: flex;
			align-items: center;

			.name_text {
				display: inline-block;
				max-width: 200rpx;
			}
		}
	}
</style>
