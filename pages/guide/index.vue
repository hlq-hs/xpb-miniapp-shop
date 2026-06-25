<template>
	<view class="launch-page">
		<view class="launch-loading">加载中...</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				redirecting: false
			}
		},
		onReady() {
			// #ifdef H5
			if (this.$wechat.isWeixin()) {
				this.$wechat.wechat();
			}
			// #endif
			this.loadExecution();
		},
		methods: {
			loadExecution() {
				if (this.redirecting) return;
				this.redirecting = true;
				const url = '/pages/index/index';
				uni.switchTab({
					url,
					fail: () => {
						uni.reLaunch({
							url
						});
					},
					complete: () => {
						setTimeout(() => {
							this.redirecting = false;
						}, 500);
					}
				});
			}
		},
		onHide() {}
	}
</script>

<style>
	page,
	.main,
	.launch-page {
		width: 100%;
		height: 100%;
	}

	.launch-page {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #fff;
	}

	.launch-loading {
		color: #999;
		font-size: 28rpx;
	}
</style>
