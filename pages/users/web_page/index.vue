<template>
	<web-view class="web-view" :webview-styles="webviewStyles" :src="url" :style="{width: windowW + 'px', height: windowH + 'px'}"></web-view>
</template>

<script>
	export default {
		//computed: mapGetters(['chatUrl']),
		data() {
			return {
				windowH: 0,
				windowW: 0,
				webviewStyles: {
					progress: {
						color: 'transparent'
					}
				},
				url: '',
				backUrl: ''
			}
		},
		onLoad(option) {
			if (option.webUel) this.url = decodeURIComponent(option.webUel);
			if (option.backUrl) this.backUrl = decodeURIComponent(option.backUrl);
			if (option.tntInstId) this.url += `${this.url.indexOf('?') === -1 ? '?' : '&'}tntInstId=${option.tntInstId}`;
			if (option.scene) this.url += `${this.url.indexOf('?') === -1 ? '?' : '&'}scene=${option.scene}`;
			uni.setNavigationBarTitle({
				title: option.title ? decodeURIComponent(option.title) : '网页'
			})
			try {
				const res = uni.getSystemInfoSync();
				this.windowW = res.windowWidth;
				this.windowH = res.windowHeight;
			} catch (e) {
				// error
			}
		},
		onBackPress() {
			if (!this.backUrl) return false;
			this.goBackUrl();
			return true;
		},
		onUnload() {
			if (!this.backUrl) return;
			setTimeout(() => {
				this.goBackUrl();
			}, 0);
		},
		methods: {
			goBackUrl() {
				if (!this.backUrl) return;
				uni.redirectTo({
					url: this.backUrl
				});
			}
		}
	}
</script>
