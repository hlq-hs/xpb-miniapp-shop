<template>
	<view class="home-page-shell">
	<homeComb
		ref="homeHeader"
		renderMode="header"
		v-if="showHomeComb"
		:bgInfo="bgInfo"
		:dataConfig="homeCombData"
		:isScrolled="isScrolled"
		:navIndex="navIndex"
		@changeTab="changeTab"
		@headerHeightChange="setHomeHeaderHeight"
	></homeComb>
	<scroll-view
		class="home-scroll"
		:style="{ top: homeHeaderHeight + 'px', height: 'calc(100vh - ' + homeHeaderHeight + 'px)' }"
		scroll-y
		:enhanced="true"
		:bounces="false"
		:show-scrollbar="false"
		lower-threshold="100"
		@scroll="handleHomeScroll"
		@scrolltolower="handleHomeReachBottom"
	>
	<view id="home" :data-theme="theme" :style="[pageStyle]">
		<tui-skeleton v-if="showSkeleton"></tui-skeleton>
		<view v-if="!errorNetwork">
			<view class="page-index tui-skeleton page_count" :class="{'bgf':navIndex >0}"
				:style="{visibility: showSkeleton ? 'hidden' : 'visible'}">
				<homeComb renderMode="content" v-if="showHomeComb" :bgInfo="bgInfo" :dataConfig="homeCombData"
					:navIndex="navIndex"></homeComb>
				<headerSearch ref="headerSearch" :isScrolled="isScrolled" v-if="showHeaderSerch" :dataConfig="headerSerchCombData"></headerSearch>
				<cateNav v-if="showCateNav" :dataConfig="cateNavData" @changeTab="changeTab"></cateNav>
				<view class="page_content skeleton">
					<view v-if="navIndex === 0">
						<view v-for="(item, index) in styleConfig" :key="index">
							<news v-if="item.name == 'news'&&!item.isHide" :dataConfig="item"></news>
							<menus v-if="item.name == 'menus'&&!item.isHide" :dataConfig="item"></menus>
							<articleList v-if="item.name == 'homeArticle'&&!item.isHide" :dataConfig="item"></articleList>
							<seckill-data v-if="item.name == 'seckill'&&!item.isHide" :dataConfig="item"></seckill-data>
							<coupon v-if="item.name == 'homeCoupons'&&!item.isHide" :dataConfig="item"></coupon>
							<pictureCube v-if="item.name == 'pictureCube'&&!item.isHide" :dataConfig="item"></pictureCube>
							<hotSpot v-if="item.name == 'homeHotspot'&&!item.isHide" :dataConfig="item"></hotSpot>
							<swiperBg v-if="item.name == 'swiperBg'&&!item.isHide" :dataConfig="item"></swiperBg>
							<shortVideo v-if="item.name == 'video'&&!item.isHide" :dataConfig="item"></shortVideo>
							<group v-if="item.name == 'group'&&!item.isHide" :dataConfig="item"></group>
							<bargain v-if="item.name == 'bargain'&&!item.isHide" :dataConfig="item"></bargain>
							<guide v-if="item.name == 'guide'&&!item.isHide" :dataConfig="item"></guide>
							<rich-text-editor v-if="item.name == 'richTextEditor'&&!item.isHide" :dataConfig="item"></rich-text-editor>
							<blank-page v-if="item.name == 'blankPage'&&!item.isHide" :dataConfig="item"></blank-page>
							<home-title v-if="item.name == 'titles'&&!item.isHide" :dataConfig="item"></home-title>
							<goodList v-if="item.name == 'goodList'&&!item.isHide" :dataConfig="item" @detail="goDetail"></goodList>
							<homeTab v-if="item.name == 'homeTab'&&!item.isHide" :dataConfig="item" @detail="goDetail"></homeTab>
						</view>
					</view>
					<view class="productList" v-if="navIndex === 1 && sortList.length>0">
						<view class="sort acea-row" :class="sortList.length ? '' : 'no_pad'" :style="{ marginTop: sortMarTop + 'px' }">
							<navigator hover-class="none" :url="'/pages/goods/goods_list/index?cid=' + item.id + '&title=' + item.name" class="item" v-for="(item, index) in sortList" :key="index" v-if="index<9">
								<view class="pictrue"><image :src="item.extra" class='slide-image tui-skeleton-rect'></image></view>
								<view class="text">{{ item.name }}</view>
							</navigator>
							<view class="item" @click="bindMore()" v-if="sortList.length >= 9">
								<view class="pictrues acea-row row-center-wrapper"><text class="iconfont icon-gengduo2"></text></view>
								<view class="text">鏇村</view>
							</view>
						</view>
					</view>
					<recommend v-if="categoryId>0" ref="recommendIndex" :categoryId='categoryId' :isShowTitle="isShowTitle" @getRecommendLength="getRecommendLength"></recommend>
					<view class='noCommodity' v-if="isNoCommodity&& navIndex > 0">
						<view class='pictrue'><image :src="urlDomain+'crmebimage/perset/staticImg/noShopper.png'"></image></view>
						<text class="text-ccc">鏆傛棤鍟嗗搧</text>
					</view>
					<!-- #ifdef H5 --><copyRight></copyRight><!-- #endif -->
					<view class="footerBottom-h10"></view>
					<view class="footerBottom"></view>
				</view>
			</view>
		</view>
		<view v-else>
			<view class="error-network">
				<image class="img" src="./error-network.png"></image>
				<view class="title">缃戠粶杩炴帴鏂紑</view>
				<view class="con">
					<view class="label">璇锋鏌ユ儏鍐碉細</view>
					<view class="item">路 鍦ㄨ缃腑鏄惁宸插紑鍚綉缁滄潈闄?</view>
					<view class="item">路 褰撳墠鏄惁澶勪簬寮辩綉鐜</view>
					<view class="item">路 鐗堟湰鏄惁杩囦綆锛屽崌绾ц瘯璇曞惂</view>
				</view>
				<view class="btn" @click="reconnect">閲嶆柊杩炴帴</view>
			</view>
		</view>
	</view>
	</scroll-view>
	<pageFooter></pageFooter>
	<view v-if="launchCouponVisible && launchCoupon" class="launch-coupon-mask" @touchmove.stop.prevent="stopTouchMove">
		<view class="launch-coupon-dialog">
			<view class="launch-coupon-close" @tap="closeLaunchCoupon">x</view>
			<view class="launch-coupon-title">优惠券待领取</view>
			<view class="launch-coupon-subtitle">进店好礼，先领券再逛</view>
			<view class="launch-coupon-card">
				<view class="launch-coupon-money">
					<text class="launch-coupon-symbol">￥</text>
					<text class="launch-coupon-num">{{ formatCouponMoney(launchCoupon.money) }}</text>
				</view>
				<view class="launch-coupon-info">
					<view class="launch-coupon-name line1">{{ launchCoupon.name }}</view>
					<view class="launch-coupon-condition">满{{ formatCouponMoney(launchCoupon.minPrice) }}元可用</view>
					<view class="launch-coupon-date">{{ getLaunchCouponDate(launchCoupon) }}</view>
				</view>
			</view>
			<view class="launch-coupon-btn" @tap="receiveLaunchCoupon">立即领取</view>
		</view>
	</view>
	</view>
</template>

<script>
import tuiSkeleton from '@/components/base/tui-skeleton.vue';
import Cache from '../../utils/cache';
import recommend from "@/components/base/recommend.vue";
import pageFooter from "@/components/pageFooter/index.vue";
import homeComb from '@/components/homeIndex/homeComb.vue';
import seckillData from '@/components/homeIndex/seckill.vue';
import coupon from '@/components/homeIndex/coupon.vue';
import menus from '@/components/homeIndex/menus.vue';
import pictureCube from '@/components/homeIndex/pictureCube.vue';
import news from '@/components/homeIndex/news.vue';
import goodList from '@/components/homeIndex/goodList.vue';
import guide from '@/components/homeIndex/guide.vue';
import articleList from '@/components/homeIndex/articleList.vue';
import swiperBg from '@/components/homeIndex/swiperBg.vue';
import headerSearch from '@/components/homeIndex/headerSearch.vue';
import cateNav from '@/components/homeIndex/cateNav.vue';
import richTextEditor from '@/components/homeIndex/richTextEditor.vue';
import shortVideo from '@/components/homeIndex/video.vue';
import homeTab from '@/components/homeIndex/homeTab.vue';
import blankPage from '@/components/homeIndex/blankPage.vue';
import homeTitle from '@/components/homeIndex/title.vue';
import hotSpot from '@/components/homeIndex/hotSpot.vue';
import group from '@/components/homeIndex/group.vue';
import bargain from '@/components/homeIndex/bargain.vue';
// #ifdef H5
import copyRight from './components/copyRight.vue';
// #endif
import { getIndexData, getTheme, getCategoryTwo, pagediyInfoApi, getCoupons, setCouponReceive } from '@/api/api.js';
// #ifdef MP-WEIXIN || APP-PLUS
import { getTemlIds } from '@/api/api.js';
// #endif
// #ifdef H5
import { getShare } from '@/api/public.js';
// #endif
import { mapGetters } from "vuex";
import { silenceBindingSpread } from '@/utils/index.js';
import animationType from '@/utils/animationType.js'
import { goProductDetail } from "../../libs/order";
import { toLogin } from '@/libs/login.js';
const arrTemp = ["beforePay", "afterPay", "createBargain", "pink"];
var statusBarHeight = uni.getSystemInfoSync().statusBarHeight + 'px';
let app = getApp();
export default {
  computed: mapGetters(['isLogin', 'uid', 'bottomNavigationIsCustom']),
  components: { tuiSkeleton,homeComb,recommend,seckillData,pageFooter,coupon,menus,pictureCube,news,goodList,articleList,swiperBg,headerSearch,cateNav,guide,richTextEditor,shortVideo,homeTab,blankPage,homeTitle,hotSpot,group,bargain
	// #ifdef H5
	,copyRight
	// #endif
  },
  data() { return { urlDomain: this.$Cache.get("imgHost"),isNoCommodity:false,isScrolled:false,homeHeaderHeight:0,categoryId:0,showSkeleton:true,isNodes:0,statusBarHeight:statusBarHeight,navIndex:0,ProductNavindex:0,sortProduct:[],site_name:'',configApi:{},listActive:0,theme:app.globalData.theme,imgHost:'',appUpdate:{},wxText:"鐐瑰嚮娣诲姞鍒版垜鐨勫皬绋嬪簭锛屽井淇￠椤典笅鎷夊嵆鍙闂晢鍩庛€?",locationContent:'授权位置信息，提供完整服务',sortMpTop:0,isFixed:true,domOffsetTop:50,prodeuctTop:30,sortList:[],sortMarTop:0,navHeight:38,domHeight:0,cateNavActive:0,couponModal:false,styleConfig:[],diyId:0,smallPage:false,isHeaderSerch:false,homeCombData:{},showCateNav:false,cateNavData:{},showHomeComb:false,showHeaderSerch:false,headerSerchCombData:{},isShowTitle:false,bgColor:'',bgPic:'',bgTabVal:'',windowHeight:0,pageStyle:{},isDefault:1,errorNetwork:false,bgInfo:{colorPicker:'#f5f5f5',isBgColor:1,},launchCoupon:null,launchCouponVisible:false,launchCouponLoading:false,launchCouponChecked:false,launchCouponLoginPending:false, } },
  onLoad(options){ if(options.spread) this.$Cache.set('spread',options.spread); if(options.scene){ let qrCodeValue = this.$util.getUrlParams(decodeURIComponent(options.scene)); let mapeMpQrCodeValue = this.$util.formatMpQrCodeData(qrCodeValue); app.globalData.spread = mapeMpQrCodeValue.spread; } let diyid = options.id ? options.id : 0; this.diyData(diyid,false); this.getIndexConfig(); let that = this; this.$nextTick(function(){ uni.getSystemInfo({ success:function(res){ that.windowHeight = res.windowHeight; } }); }) },
  onShow(){ !this.bottomNavigationIsCustom&&uni.showTabBar(); this.getTokenIsExist(); this.checkLaunchCoupon(); this.$nextTick(()=>{ if(this.$refs.homeHeader) this.$refs.homeHeader.refreshDefaultVehicle(); if(this.$refs.headerSearch) this.$refs.headerSearch.refreshDefaultVehicle(); }); },
  methods:{
		checkLaunchCoupon(){
			// #ifndef MP-WEIXIN
			return;
			// #endif
			if (this.launchCouponLoading || (this.launchCouponChecked && !this.launchCouponLoginPending)) {
				return;
			}
			this.launchCouponLoading = true;
			getCoupons({ page: 1, limit: 20 }).then(res => {
				const list = res && res.data && Array.isArray(res.data.list) ? res.data.list : [];
				const coupon = list.find(item => item && item.isUse !== true && item.isUse !== 2);
				this.launchCoupon = coupon || null;
				this.launchCouponVisible = !!coupon;
				this.launchCouponChecked = true;
				this.launchCouponLoginPending = false;
			}).catch(() => {
				this.launchCouponChecked = true;
			}).finally(() => {
				this.launchCouponLoading = false;
			});
		},
		closeLaunchCoupon(){
			this.launchCouponVisible = false;
			this.launchCouponLoginPending = false;
		},
		receiveLaunchCoupon(){
			if (!this.launchCoupon || this.launchCouponLoading) {
				return;
			}
			if (!this.isLogin) {
				this.launchCouponVisible = false;
				this.launchCouponLoginPending = true;
				this.launchCouponChecked = false;
				toLogin();
				return;
			}
			this.launchCouponLoading = true;
			setCouponReceive(this.launchCoupon.id).then(() => {
				this.launchCouponVisible = false;
				this.launchCoupon = null;
				this.launchCouponChecked = true;
				this.$util.Tips({ title: '领取成功' });
			}).catch(err => {
				this.$util.Tips({ title: err || '领取失败' });
			}).finally(() => {
				this.launchCouponLoading = false;
			});
		},
		formatCouponMoney(value){
			const num = Number(value);
			if (Number.isNaN(num)) {
				return value || '0';
			}
			return Number.isInteger(num) ? String(num) : num.toFixed(2);
		},
		getLaunchCouponDate(coupon){
			if (!coupon) {
				return '';
			}
			if (coupon.day > 0) {
				return `领取后${coupon.day}天内可用`;
			}
			return coupon.useStartTimeStr && coupon.useEndTimeStr ? `${coupon.useStartTimeStr} - ${coupon.useEndTimeStr}` : '';
		},
		setHomeHeaderHeight(height){
			this.homeHeaderHeight = Math.max(Number(height || 0), 0);
		},
		handleHomeScroll(e){
			const scrollTop = e && e.detail ? e.detail.scrollTop : 0;
			uni.$emit('scroll');
			this.isScrolled = Number(scrollTop || 0) > 0;
		},
		handleHomeReachBottom(){
			const recommend = this.$refs.recommendIndex;
			if (recommend && typeof recommend.get_host_product === 'function') {
				recommend.get_host_product();
			}
		},
    getTokenIsExist(){ this.$LoginAuth.getTokenIsExist().then(data=>{ if(data){ silenceBindingSpread(); } }); },
    getInitTheme(){ getTheme().then(resP=>{ this.$Cache.set('theme', `theme${Number(resP.data.value)}`); }) },
    snycNetWork(){ uni.getNetworkType({success:res=>{ this.errorNetwork = res.networkType === 'none'; if(this.errorNetwork) this.reloadData(); }}); },
    reconnect(){ uni.getNetworkType({success:res=>{ this.errorNetwork = res.networkType === 'none'; if(!this.errorNetwork){ setTimeout(()=>{ uni.reLaunch({url:'/pages/index/index'}); },1000) } }}); },
    diyData(id,type){ let that=this; that.styleConfig=[]; uni.showLoading({title:'加载中...'}); pagediyInfoApi(id).then(res=>{ that.errorNetwork=false; uni.setNavigationBarTitle({title:res.data.title}); uni.setNavigationBarColor({frontColor:res.data.titleColor,backgroundColor:res.data.titleBgColor.toString().toLowerCase()}); let data=res.data; that.diyId=res.data.id; that.isDefault=data.isDefault; that.styleConfig=that.$util.objToArr(res.data.value); this.bgInfo.isBgColor=data.isBgColor; this.bgInfo.colorPicker=data.colorPicker; that.pageStyle={'background-color':data.isBgColor===1?res.data.colorPicker:'','background-image':data.isBgPic===1?`url(${res.data.bgPic})`:'','background-repeat':res.data.bgTabVal===1?'repeat-y':'no-repeat','background-size':res.data.bgTabVal===2?'cover':'contain'}; uni.hideLoading(); if(type){ that.styleConfig.forEach((item)=>{ if(item.name=='headerSerch'||item.name=='homeComb'||item.name=='tabNav'){ that.styleConfig.splice(index,1); } }); } else { that.styleConfig.forEach((item)=>{ if(item.name==='tabNav'&&!item.isHide){ that.showCateNav=true; that.cateNavData=item; } if(item.name==='homeComb'&&!item.isHide){ that.showHomeComb=true; that.homeCombData=item; } if(item.name==='headerSerch'&&!item.isHide){ that.showHeaderSerch=true; that.headerSerchCombData=item; } }); } setTimeout(()=>{ that.isNodes++; },100); }).catch(err=>{ uni.hideLoading(); return that.$util.Tips({title:err}); }); },
    bindMore(){ uni.setStorageSync('categoryId', this.categoryId); uni.switchTab({url:`/pages/goods_cate/goods_cate`}) },
    getRecommendLength(e){ this.isNoCommodity = e == 0 ? true : false; },
    changeTab(index,item){
      this.cateNavActive=index;
      if(item.type==1){
        this.navIndex=1;
        if(!item.val){
          this.sortList=[];
          this.categoryId=0;
          this.$util.Tips({title:'请在平台端选择商品分类！确保加载商品分类数据。'});
          return;
        } else {
          getCategoryTwo(item.val).then(res=>{ this.sortList=res.data; });
          this.categoryId=item.val;
          this.isShowTitle=false;
        }
      } else if(item.type==0){
        this.navIndex=0;
        this.isShowTitle=true;
        this.categoryId=0;
        if(!item.val){
          return this.$util.Tips({title:'请在平台端选择微页面链接！确保加载微页面数据。'});
        } else {
          this.styleConfig=[];
          this.diyData(item.val,true);
        }
      } else {
        this.categoryId=0;
        this.navIndex=0;
        this.styleConfig=[];
        this.diyData(item.val,false);
      }
    },
    toNewsList(){ uni.navigateTo({animationType:animationType.type,animationDuration:animationType.duration,url:'/pages/goods/news_list/index'}) },
    reloadData(){ this.showSkeleton=false; },
    getElementData(el,callback){ uni.createSelectorQuery().in(this).selectAll(el).boundingClientRect().exec((data)=>{ callback(data[0]); }); },
    xieyiApp(){ uni.navigateTo({url:'/pages/users/web_page/index?webUel=https://admin.java.crmeb.net/useragreement/xieyi.html&title=鍗忚鍐呭'}) },
    getTemlIds(){ for(var i in arrTemp){ this.getTem(arrTemp[i]); } },
    getTem(data){ getTemlIds({type:data}).then(res=>{ if(res.data){ let arr=res.data.map((item)=>{ return item.tempId }); wx.setStorageSync('tempID'+data, arr); } }); },
    getIndexConfig(){ let that=this; getIndexData().then(res=>{ let imgHost = res.data.logoUrl+'/'; that.imgHost=imgHost; that.$Cache.set('imgHost', imgHost); that.$store.commit('SET_CHATURL', res.data.yzfUrl); Cache.set('chatUrl', res.data.yzfUrl); that.$Cache.setItem({name:'categoryConfig', value:{categoryConfig:res.data.categoryPageConfig,isShowCategory:res.data.isShowCategory}}); Cache.setItem({name:'chatConfig', value:{consumer_hotline:res.data.consumerHotline,telephone_service_switch:res.data.telephoneServiceSwitch,wx_chant_independent:res.data.wxChatIndependent}}); this.reloadData(); }).catch(err=>{ return this.$util.Tips({title:err}); }); },
    appVersionConfig(){}, shareApi(){}, setOpenShare(){}, stopTouchMove(){ return true }, closeDialog(){ this.couponModal=false; this.$Cache.clear('newGift'); },
    goDetail(item){ goProductDetail(item.id,0,'') }
  },
  mounted(){ let query = uni.createSelectorQuery().in(this); query.select('#home').boundingClientRect(); query.exec(res=>{ this.domHeight = res[0].height; }) }
}
</script>
<style>
	page { height: auto; display: flex; flex-direction: column; height: 100%; background-color: #fff; }
</style>
<style lang="scss" scoped>
	.home-page-shell {
		position: relative;
		height: 100vh;
		overflow: hidden;
	}

	.home-scroll {
		position: absolute;
		left: 0;
		width: 100%;
		overflow: hidden;
	}

	.error-network { position: fixed; left: 0; top: 0; display: flex; flex-direction: column; align-items: center; width: 100%; height: 100%; padding-top: 30%; background: #fff; }
	.ysize { background-size: 100%; }
	.fullsize { background-size: 100% 100%; }
	.repeat { background-repeat: repeat; }
	.noRepeat { background-repeat: no-repeat; }
	.noCommodity { margin-top: 30%; }
	.icon-gengduo1 { color: #F8F8F8; }
	.pageIndex { padding: 0 24rpx; }
	.productList { background-color: #F5F5F5; margin-top: 20rpx; }
	.footerBottom-h10 { height: 20rpx; color: j8bc6f6 }
	.launch-coupon-mask {
		position: fixed;
		left: 0;
		top: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.55);
	}
	.launch-coupon-dialog {
		position: relative;
		width: 620rpx;
		padding: 52rpx 36rpx 40rpx;
		border-radius: 24rpx;
		background: linear-gradient(180deg, #fff7f2 0%, #ffffff 48%, #ffffff 100%);
		box-sizing: border-box;
	}
	.launch-coupon-close {
		position: absolute;
		right: 24rpx;
		top: 20rpx;
		width: 44rpx;
		height: 44rpx;
		line-height: 42rpx;
		text-align: center;
		border-radius: 50%;
		color: #999;
		font-size: 32rpx;
	}
	.launch-coupon-title {
		text-align: center;
		color: #e93323;
		font-size: 40rpx;
		font-weight: 700;
	}
	.launch-coupon-subtitle {
		margin-top: 12rpx;
		text-align: center;
		color: #999;
		font-size: 26rpx;
	}
	.launch-coupon-card {
		display: flex;
		align-items: center;
		margin-top: 36rpx;
		padding: 28rpx 24rpx;
		border-radius: 18rpx;
		background: #fff2ec;
	}
	.launch-coupon-money {
		min-width: 190rpx;
		color: #e93323;
		font-weight: 700;
	}
	.launch-coupon-symbol {
		font-size: 34rpx;
	}
	.launch-coupon-num {
		font-size: 64rpx;
	}
	.launch-coupon-info {
		flex: 1;
		min-width: 0;
		padding-left: 22rpx;
		color: #333;
	}
	.launch-coupon-name {
		font-size: 30rpx;
		font-weight: 600;
	}
	.launch-coupon-condition,
	.launch-coupon-date {
		margin-top: 10rpx;
		color: #888;
		font-size: 24rpx;
	}
	.launch-coupon-btn {
		margin-top: 36rpx;
		height: 82rpx;
		line-height: 82rpx;
		text-align: center;
		border-radius: 41rpx;
		background: linear-gradient(90deg, #ff6a3c, #e93323);
		color: #fff;
		font-size: 30rpx;
		font-weight: 600;
	}
</style>
