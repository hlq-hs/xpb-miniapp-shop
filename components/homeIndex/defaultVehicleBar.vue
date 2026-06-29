<template>
	<view class="default-vehicle-bar" @click="openVehiclePage">
		<text class="vehicle-icon">🚗</text>
		<block v-if="vehicle">
			<text class="vehicle-desc">{{ vehicleDescription || "车辆信息" }}</text>
		</block>
		<block v-else>
			<text class="vehicle-empty">+ 添加车辆</text>
		</block>
	</view>
</template>

<script>
	import { getUserCarInfo, getUserCarList } from "@/api/userCar.js";

	export default {
		name: "defaultVehicleBar",
		data() {
			return {
				vehicle: null,
				loading: false,
				refreshPending: false
			};
		},
		computed: {
			vehicleDescription() {
				if (!this.vehicle) return "";
				return [this.vehicle.brandName, this.vehicle.seriesName].filter(Boolean).join("·");
			}
		},
		created() {
			this.vehicleChangedHandler = () => this.refresh();
			uni.$on("vehicleInfoChanged", this.vehicleChangedHandler);
			this.refresh();
		},
		beforeDestroy() {
			if (this.vehicleChangedHandler) {
				uni.$off("vehicleInfoChanged", this.vehicleChangedHandler);
			}
		},
		methods: {
			refresh() {
				if (this.loading) {
					this.refreshPending = true;
					return;
				}
				const token = this.$store && this.$store.state && this.$store.state.app
					? this.$store.state.app.token
					: "";
				if (!token) {
					this.vehicle = null;
					return;
				}
				this.loading = true;
				getUserCarList({
					page: 1,
					limit: 20,
					uid: this.$store.state.app.uid || ""
				}).then((res) => {
					const pageData = (res && res.data) || {};
					const list = Array.isArray(pageData.list) ? pageData.list : [];
					const selected = list.find(item => Number(item.isDefault) === 1) || list[0] || null;
					if (!selected || !selected.id) return selected;
					return getUserCarInfo(selected.id).then(detailRes => ({
						...selected,
						...((detailRes && detailRes.data) || {})
					})).catch(() => selected);
				}).then((vehicle) => {
					this.vehicle = vehicle || null;
				}).catch(() => {
					this.vehicle = null;
				}).finally(() => {
					this.loading = false;
					if (this.refreshPending) {
						this.refreshPending = false;
						this.refresh();
					}
				});
			},
			openVehiclePage() {
				uni.navigateTo({
					url: this.vehicle
						? "/pages/users/vehicle_manage/index"
						: "/pages/users/vehicle_manage/index?add=1"
				});
			}
		}
	};
</script>

<style lang="scss" scoped>
	.default-vehicle-bar {
		height: 100%;
		display: flex;
		align-items: center;
		padding: 0 24rpx;
		box-sizing: border-box;
		color: #333;
		font-size: 24rpx;
		overflow: hidden;
	}

	.vehicle-icon {
		margin-right: 10rpx;
		font-size: 28rpx;
		white-space: nowrap;
	}

	.vehicle-desc {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: 27rpx;
		font-weight: 500;
		color: #333;
	}

	.vehicle-empty {
		font-size: 26rpx;
		font-weight: 500;
		color: #333;
	}

</style>
