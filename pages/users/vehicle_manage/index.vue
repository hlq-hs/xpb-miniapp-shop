<template>
	<view :data-theme="theme">
		<view class="add-car-page" v-if="addPageVisible">
			<view class="plate-section">
				<view class="add-title">输入车牌自动识别车型</view>
				<view class="add-subtitle">平台会严格保护您的信息</view>
				<view class="plate-row">
					<view
						class="plate-box"
						:class="{ active: activePlateIndex === index, special: isSpecialPlateChar(plateChars[index]) }"
						v-for="index in plateIndexes"
						:key="`${plateResetKey}-${index}`"
						:data-index="index"
						@tap.stop="setActivePlate"
					>
						<text>{{ plateChars[index] || "" }}</text>
						<text v-if="isSpecialPlateChar(plateChars[index])" class="plate-special-mark">特</text>
					</view>
					<view
						class="new-energy"
						:class="{ active: activePlateIndex === 7, special: isSpecialPlateChar(plateChars[7]) }"
						@tap.stop="setNewEnergyPlate"
					>
						<block v-if="plateChars[7]">
							<view class="new-energy-value">{{ plateChars[7] }}</view>
							<text v-if="isSpecialPlateChar(plateChars[7])" class="plate-special-mark">特</text>
						</block>
						<block v-else>
							<view class="new-energy-plus">+</view>
							<view>新能源</view>
						</block>
					</view>
				</view>
				<view
					class="auto-btn"
					:class="{ disabled: recognizing }"
					v-if="recognitionMode !== 'license' || !recognitionItems.length"
					@click="recognizeVehicle"
				>
					{{ recognizing ? "识别中..." : "自动识别车型" }}
				</view>
				<view class="recognition-result" v-if="recognitionItems.length">
					<view class="recognition-title">识别结果</view>
					<view class="recognition-row" v-for="(item, index) in recognitionItems" :key="index">
						<text class="recognition-label">{{ item.label }}</text>
						<input
							v-if="item.editable"
							class="recognition-input"
							:value="item.value"
							:type="item.inputType || 'text'"
							:placeholder="item.placeholder || ''"
							@input="updateRecognitionValue(item.key, $event)"
						/>
						<text v-else class="recognition-value">{{ item.value }}</text>
					</view>
					<view class="recognition-row">
						<text class="recognition-label">公里数</text>
						<view class="mileage-field">
							<input
								v-model="recognitionMileage"
								class="recognition-input mileage-input"
								type="number"
								placeholder="请输入公里数（选填）"
							/>
							<text class="mileage-unit">公里</text>
						</view>
					</view>
				</view>
				<view
					class="recognition-submit"
					:class="{ disabled: submitting }"
					v-if="recognitionItems.length"
					@click="confirmRecognition"
				>{{ submitting ? "提交中..." : "确认提交" }}</view>
			</view>
			<view class="other-section">
				<view class="other-title">选择其它方式添加爱车</view>
				<view class="other-actions">
					<view class="outline-btn" :class="{ disabled: isRecognizingVin }" @click="handleLicenseRecognition">
						{{ isRecognizingVin ? "识别中..." : "行驶证识别" }}
					</view>
				</view>
			</view>
		</view>

		<view class="vehicle-management" v-else>
			<view class="vehicle-search">
				<text class="iconfont icon-sousuo"></text>
				<input
					v-model="searchKeyword"
					class="vehicle-search-input"
					confirm-type="search"
					placeholder="搜索车牌、品牌、车型或车架号"
				/>
				<text class="vehicle-search-clear" v-if="searchKeyword" @click="searchKeyword = ''">×</text>
			</view>
			<radio-group class="radio-group" @change="radioChange" v-if="filteredVehicleList.length">
				<view class="item borRadius14" v-for="item in filteredVehicleList" :key="item.id">
					<view class="vehicle-info">
						<view class="vehicle-detail-row">
							<text class="vehicle-detail-label">车牌号</text>
							<text class="vehicle-detail-value vehicle-name">{{ item.carNo || "-" }}</text>
						</view>
						<view class="vehicle-detail-row">
							<text class="vehicle-detail-label">品牌</text>
							<text class="vehicle-detail-value">{{ item.brandName || "-" }}</text>
						</view>
						<view class="vehicle-detail-row">
							<text class="vehicle-detail-label">车系</text>
							<text class="vehicle-detail-value">{{ item.seriesName || "-" }}</text>
						</view>
						<view class="vehicle-detail-row">
							<text class="vehicle-detail-label">车型</text>
							<text class="vehicle-detail-value">{{ item.modelName || "-" }}</text>
						</view>
						<view class="vehicle-detail-row">
							<text class="vehicle-detail-label">年款</text>
							<text class="vehicle-detail-value">{{ item.carYear || "-" }}</text>
						</view>
						<view class="vehicle-detail-row">
							<text class="vehicle-detail-label">车架号</text>
							<text class="vehicle-detail-value">{{ item.vinCode || "-" }}</text>
						</view>
						<view class="vehicle-detail-row">
							<text class="vehicle-detail-label">公里数</text>
							<text class="vehicle-detail-value">{{ formatVehicleField(item, ["mileage", "repKm"]) }}</text>
						</view>
					</view>
					<view class="operation acea-row row-between-wrapper">
						<view @tap.stop="setDefaultVehicle(item)">
							<radio class="radio" :value="String(item.id)" :checked="Number(item.isDefault) === 1">
								<text>设为默认</text>
							</radio>
						</view>
						<view class="acea-row row-middle">
							<view @click="editVehicle(item)"><text class="iconfont icon-bianji"></text>编辑</view>
							<view @click="delVehicleById(item.id)"><text class="iconfont icon-shanchu"></text>删除</view>
						</view>
					</view>
				</view>
			</radio-group>
			<view class="no-data search-empty" v-if="vehicleList.length && !filteredVehicleList.length">未找到相关车辆</view>
			<view class="no-data" v-if="!vehicleList.length && loadend">暂无车辆信息</view>
			<view class="loadingicon acea-row row-center-wrapper" v-if="vehicleList.length">{{ loadTitle }}</view>
			<view style="height:120rpx;"></view>
		</view>

		<view class="footer acea-row row-center-wrapper" v-if="!addPageVisible">
			<view class="addressBnt bg_color on" @click="addVehicle">
				<text class="add-plus">+</text>添加车辆信息
			</view>
		</view>

		<view class="form-mask" v-if="formVisible" @click="closeForm">
			<view class="form-panel" @click.stop>
				<view class="form-title">{{ form.id ? "编辑车辆信息" : "添加车辆信息" }}</view>
				<view class="form-item">
					<text>车牌号</text>
					<input v-model="form.carNo" maxlength="10" placeholder="请输入车牌号" />
				</view>
				<view class="form-item">
					<text>品牌</text>
					<input v-model="form.brandName" maxlength="30" placeholder="请输入品牌" />
				</view>
				<view class="form-item">
					<text>车系</text>
					<input v-model="form.seriesName" maxlength="30" placeholder="请输入车系" />
				</view>
				<view class="form-item">
					<text>车型</text>
					<input v-model="form.modelName" maxlength="50" placeholder="请输入车型" />
				</view>
				<view class="form-item">
					<text>年款</text>
					<input v-model="form.carYear" type="number" maxlength="4" placeholder="请输入年款" />
				</view>
				<view class="form-item">
					<text>VIN码</text>
					<input v-model="form.vinCode" maxlength="30" placeholder="选填" />
				</view>
				<view class="form-item">
					<text>公里数</text>
					<input v-model="form.mileage" type="number" placeholder="请输入公里数（选填）" />
				</view>
				<view class="form-default acea-row row-between-wrapper">
					<text>设为默认车辆</text>
					<switch :checked="Number(form.isDefault) === 1" color="#f44336" @change="defaultChange" />
				</view>
				<view class="form-actions acea-row row-between-wrapper">
					<view class="form-btn cancel" @click="closeForm">取消</view>
					<view class="form-btn confirm bg_color" @click="submitVehicle">保存</view>
				</view>
			</view>
		</view>

		<view class="plate-keyboard-panel" v-if="plateKeyboardVisible">
			<view class="keyboard-toolbar">
				<view></view>
				<view @click="hidePlateKeyboard">完成</view>
			</view>
			<u-car-keyboard ref="carKeyboard" @change="inputPlateKey" @backspace="deletePlateKey"></u-car-keyboard>
		</view>

	</view>
</template>

<script>
	import {
		deleteUserCar,
		getUserCarInfo,
		getUserCarList,
		saveUserCar,
		setDefaultUserCar,
		updateUserCar
	} from "@/api/userCar.js";
	import { getCarInfoByCarNo } from "@/api/user.js";
	import {
		chooseVinImage,
		getVinRecognitionErrorMessage,
		queryVehicleByVin,
		recognizeVinFromImage
	} from "@/utils/vinRecognition.js";

	let app = getApp();

	const emptyForm = () => ({
		id: "",
		carNo: "",
		brandName: "",
		seriesName: "",
		modelName: "",
		carYear: "",
		vinCode: "",
		mileage: "",
		isNewEnergy: 0,
		isDefault: 0
	});

	const PLATE_PROVINCES = "京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领学警港澳";
	const PLATE_LETTER_REG = /^[A-HJ-NP-Z]$/;
	const PLATE_LETTER_NUMBER_REG = /^[A-HJ-NP-Z0-9]$/;
	const PLATE_SPECIAL_SUFFIXES = "学警港澳挂使领";

	export default {
		data() {
			return {
				theme: app.globalData.theme,
				vehicleList: [],
				form: emptyForm(),
				plateIndexes: [0, 1, 2, 3, 4, 5, 6],
				plateChars: ["", "", "", "", "", "", "", ""],
				activePlateIndex: 0,
				plateResetKey: 0,
				plateKeyboardVisible: false,
				addPageVisible: false,
				formVisible: false,
				recognizing: false,
				isRecognizingVin: false,
				submitting: false,
				recognitionMode: "",
				recognitionResult: null,
				recognitionMileage: "",
				searchKeyword: "",
				loading: false,
				settingDefaultCarId: "",
				sourceFrom: "",
				loadend: false,
				loadTitle: "加载更多",
				page: 1,
				limit: 20
			};
		},
		computed: {
			filteredVehicleList() {
				const keyword = String(this.searchKeyword || "").trim().toLowerCase();
				if (!keyword) return this.vehicleList;
				return this.vehicleList.filter((item) => ([
					item.carNo,
					item.brandName,
					item.seriesName,
					item.modelName,
					item.carYear,
					item.vinCode,
					item.mileage,
					item.repKm
				].filter(value => value !== undefined && value !== null).join(" ").toLowerCase().indexOf(keyword) !== -1));
			},
			recognitionItems() {
				const result = this.recognitionResult;
				if (result === null || result === undefined || result === "") return [];
				const labelMap = {
					cusCarOem: "车辆品牌",
					CusCarOem: "车辆品牌",
					cusCarName: "车系",
					CusCarName: "车系",
					cusCarType: "车辆型号",
					CusCarType: "车辆型号",
					listingYear: "年款",
					ListingYear: "年款",
					cusCarNo: "车牌",
					CusCarNo: "车牌",
					carNo: "车牌",
					cusCarVIN: "车架号",
					CusCarVIN: "车架号",
					brandName: "品牌",
					carBrand: "品牌",
					seriesName: "车系",
					carSeries: "车系",
					modelName: "车型",
					carModel: "车型",
					carYear: "年款",
					vinCode: "车架号"
				};
				if (Array.isArray(result)) {
					return result.map((value, index) => ({
						label: `车型信息${result.length > 1 ? index + 1 : ""}`,
						value: this.formatRecognitionValue(value)
					}));
				}
				if (typeof result !== "object") {
					return [{ label: "车型信息", value: String(result) }];
				}
				return Object.keys(result)
					.filter((key) => {
						if (["cusCarNo", "CusCarNo", "carNo"].indexOf(key) !== -1) return true;
						if (["listingYear", "ListingYear", "carYear"].indexOf(key) !== -1) return true;
						return result[key] !== null && result[key] !== undefined && result[key] !== "";
					})
					.sort((a, b) => {
						const carNoKeys = ["cusCarNo", "CusCarNo", "carNo"];
						const aIsCarNo = carNoKeys.indexOf(a) !== -1;
						const bIsCarNo = carNoKeys.indexOf(b) !== -1;
						return aIsCarNo === bIsCarNo ? 0 : (aIsCarNo ? -1 : 1);
					})
					.map((key) => ({
						key,
						label: labelMap[key] || key,
						value: this.formatRecognitionValue(result[key]),
						placeholder: ["cusCarNo", "CusCarNo", "carNo"].indexOf(key) !== -1
							? "请输入车牌号"
							: (["listingYear", "ListingYear", "carYear"].indexOf(key) !== -1 ? "请输入年款（选填）" : ""),
						inputType: ["listingYear", "ListingYear", "carYear"].indexOf(key) !== -1 ? "number" : "text",
						editable: typeof result[key] !== "object"
					}));
			}
		},
		onLoad(options = {}) {
			this.sourceFrom = String(options.add || "") === "1" && String(options.from || "") === "inquiry"
				? "inquiry"
				: "";
			this.getVehicleList(true);
			if (String(options.add || "") === "1") {
				this.$nextTick(() => {
					this.addVehicle();
				});
			}
		},
		onShow() {
			this.getVehicleList(true);
		},
		onReachBottom() {
			this.getVehicleList();
		},
		onBackPress() {
			if (this.addPageVisible) {
				this.closeAddPage();
				return true;
			}
			return false;
		},
		methods: {
			isSpecialPlateChar(char) {
				const value = String(char || "").trim();
				return !!value && PLATE_SPECIAL_SUFFIXES.indexOf(value) !== -1;
			},
			redirectToInquiryAfterSave() {
				if (this.sourceFrom !== "inquiry") return false;
				setTimeout(() => {
					uni.redirectTo({
						url: "/pages/users/inquiry_quote/index"
					});
				}, 500);
				return true;
			},
			normalizeCarNo(value) {
				return String(value || "").replace(/\s+/g, "").toUpperCase();
			},
			getPlateLengthByValue(value) {
				return this.normalizeCarNo(value).length >= 8 ? 8 : 7;
			},
			getPlateCharError(char, index) {
				const value = String(char || "").trim().toUpperCase();
				if (!value) return `请输入第${index + 1}位车牌号`;
				if (value.length !== 1) return `第${index + 1}位只能输入1个字符`;
				if (index === 0) {
					return PLATE_PROVINCES.indexOf(value) === -1 ? "第一位只能输入省份简称" : "";
				}
				if (index === 1) {
					return PLATE_LETTER_REG.test(value) ? "" : "第二位只能输入字母";
				}
				const isLastPlateChar = index === this.maxPlateLength() - 1;
				const allowSpecialSuffix = isLastPlateChar && PLATE_SPECIAL_SUFFIXES.indexOf(value) !== -1;
				if (PLATE_LETTER_NUMBER_REG.test(value) || allowSpecialSuffix) return "";
				return isLastPlateChar
					? `第${index + 1}位只能输入字母、数字或特殊车牌字`
					: `第${index + 1}位只能输入字母或数字`;
			},
			validatePlateChar(char, index) {
				const message = this.getPlateCharError(char, index);
				if (message) {
					uni.showToast({
						title: message,
						icon: "none"
					});
					return false;
				}
				return true;
			},
			validateCarNo(carNo) {
				const value = this.normalizeCarNo(carNo);
				const length = this.getPlateLengthByValue(value);
				if (!value) {
					uni.showToast({
						title: "请输入车牌号",
						icon: "none"
					});
					return false;
				}
				if (value.length !== length) {
					uni.showToast({
						title: length === 8 ? "新能源车牌请输入8位" : "普通车牌请输入7位",
						icon: "none"
					});
					return false;
				}
				for (let i = 0; i < length; i += 1) {
					const message = this.getPlateCharError(value[i], i);
					if (message) {
						uni.showToast({
							title: message,
							icon: "none"
						});
						return false;
					}
				}
				return true;
			},
			async handleLicenseRecognition() {
				if (this.isRecognizingVin) return;
				try {
					const imagePath = await chooseVinImage();
					this.isRecognizingVin = true;
					this.form = emptyForm();
					this.plateChars = ["", "", "", "", "", "", "", ""];
					this.activePlateIndex = 0;
					this.plateResetKey += 1;
					this.recognitionMode = "";
					this.recognitionResult = null;
					this.recognitionMileage = "";
					this.plateKeyboardVisible = false;
					uni.showLoading({ title: "识别中", mask: true });
					const vin = await recognizeVinFromImage(imagePath);
					const result = await queryVehicleByVin(vin);
					const list = Array.isArray(result.data) ? result.data : [];
					const vehicle = list[0] || {};
					const brandName = vehicle.carBrandName || vehicle.brandName || vehicle.cusCarOem || "";
					const seriesName = vehicle.seriesZh || vehicle.seriesName || vehicle.cusCarName || "";
					const modelName = vehicle.saleModelName || vehicle.carModelName || vehicle.modelName || vehicle.cusCarType || "";
					if (!brandName && !seriesName && !modelName) throw new Error("VEHICLE_NOT_FOUND");
					this.form.vinCode = vin;
					this.recognitionMileage = "";
					this.recognitionResult = {
						cusCarOem: brandName,
						cusCarName: seriesName,
						cusCarType: modelName,
						listingYear: vehicle.listingYear || vehicle.carYear || vehicle.marketYear || "",
						cusCarNo: this.form.carNo || "",
						cusCarVIN: vin
					};
					this.recognitionMode = "license";
					uni.showToast({ title: "识别成功", icon: "success" });
				} catch (error) {
					const rawMessage = String((error && error.message) || error || "");
					const message = rawMessage === "VEHICLE_NOT_FOUND"
						? "已识别VIN，但未查询到车型"
						: getVinRecognitionErrorMessage(error);
					if (message) uni.showToast({ title: message, icon: "none", duration: 2500 });
				} finally {
					this.isRecognizingVin = false;
					uni.hideLoading();
				}
			},
			showRecognitionFallback() {
				uni.showModal({
					title: "未识别到车型",
					content: "请使用行驶证识别",
					showCancel: false,
					confirmText: "我知道了",
					confirmColor: "#ef3330"
				});
			},
			confirmRecognition() {
				if (this.submitting || !this.recognitionResult) return;
				const getField = (keys) => {
					for (let i = 0; i < keys.length; i += 1) {
						const value = this.recognitionResult[keys[i]];
						if (value !== undefined && value !== null && value !== "") return value;
					}
					return "";
				};
				const carYear = getField(["listingYear", "ListingYear", "carYear"]);
				const carNo = this.normalizeCarNo(getField(["cusCarNo", "CusCarNo", "carNo"]) || this.form.carNo || "");
				if (!this.validateCarNo(carNo)) return;
				const normalizedCarNo = this.normalizeCarNo(carNo);
				const carAlreadyExists = this.vehicleList.some((item) => (
					this.normalizeCarNo(item && item.carNo) === normalizedCarNo
				));
				if (carAlreadyExists) {
					uni.showToast({
						title: "该车牌已存在，请勿重复添加",
						icon: "none",
						duration: 2500
					});
					return;
				}
				const payload = {
					uid: this.$store.state.app.uid || undefined,
					carNo,
					brandName: getField(["cusCarOem", "CusCarOem", "brandName", "carBrand"]),
					seriesName: getField(["cusCarName", "CusCarName", "seriesName", "carSeries"]),
					modelName: getField(["cusCarType", "CusCarType", "modelName", "carModel"]),
					carYear: carYear === "" ? undefined : Number(carYear),
					vinCode: getField(["cusCarVIN", "CusCarVIN", "vinCode"]),
					mileage: this.recognitionMileage === "" ? undefined : Number(this.recognitionMileage),
					isNewEnergy: Number(this.form.isNewEnergy) === 1 ? 1 : 0,
					isDefault: 0
				};
				this.submitting = true;
				saveUserCar(payload).then(() => {
					uni.showToast({
						title: "添加成功",
						icon: "success"
					});
					this.closeAddPage();
					if (!this.redirectToInquiryAfterSave()) {
						this.getVehicleList(true);
					}
				}).catch((err) => {
					uni.showToast({
						title: (err && (err.message || err.msg)) || err || "添加失败",
						icon: "none"
					});
				}).finally(() => {
					this.submitting = false;
				});
			},
			updateRecognitionValue(key, event) {
				if (!key || !this.recognitionResult || typeof this.recognitionResult !== "object") return;
				const value = event.detail.value;
				this.$set(this.recognitionResult, key, value);
				if (["cusCarNo", "CusCarNo", "carNo"].indexOf(key) !== -1) {
					this.form.carNo = value;
					this.form.isNewEnergy = String(value || "").length >= 8 ? 1 : 0;
					this.plateChars = String(value || "").split("").concat(["", "", "", "", "", "", "", ""]).slice(0, 8);
				}
			},
			formatRecognitionValue(value) {
				if (typeof value === "object" && value !== null) {
					try {
						return JSON.stringify(value);
					} catch (e) {
						return String(value);
					}
				}
				return String(value);
			},
			getVehicleDetails(list) {
				return Promise.all(list.map((item) => {
					if (!item || !item.id) return Promise.resolve(item);
					return getUserCarInfo(item.id).then((res) => ({
						...item,
						...(res.data || {})
					})).catch(() => item);
				}));
			},
			getVehicleList(isPage = false) {
				if (isPage) {
					this.page = 1;
					this.loadend = false;
					this.vehicleList = [];
				}
				if (this.loading || this.loadend) return;
				this.loading = true;
				this.loadTitle = "";
				getUserCarList({
					page: this.page,
					limit: this.limit,
					uid: this.$store.state.app.uid || ""
				}).then((res) => {
					const pageData = res.data || {};
					const list = pageData.list || [];
					return this.getVehicleDetails(list).then((detailList) => {
						this.vehicleList = isPage ? detailList : this.vehicleList.concat(detailList);
						this.loadend = list.length < this.limit || this.page >= (pageData.totalPage || 0);
						this.loadTitle = this.loadend ? "我也是有底线的~" : "加载更多";
						this.page += 1;
					});
				}).catch((err) => {
					this.loadTitle = "加载更多";
					uni.showToast({
						title: err || "加载失败",
						icon: "none"
					});
				}).finally(() => {
					this.loading = false;
				});
			},
			formatVehicleField(item, keys) {
				if (!item) return "-";
				for (let i = 0; i < keys.length; i += 1) {
					const value = item[keys[i]];
					if (value !== undefined && value !== null && value !== "") return value;
				}
				return "-";
			},
			formatVehicleInfo(item) {
				return [item.brandName, item.seriesName, item.modelName || (item.carYear ? `${item.carYear}款` : "")]
					.filter(Boolean)
					.join(" ") || "-";
			},
			setDefaultVehicle(vehicle) {
				if (!vehicle || vehicle.id === undefined || vehicle.id === null || this.settingDefaultCarId !== "") return;
				this.settingDefaultCarId = String(vehicle.id);
				uni.showLoading({ title: "设置中", mask: true });
				setDefaultUserCar(vehicle.id).then(() => {
					uni.showToast({
						title: "设置成功",
						icon: "success"
					});
					uni.$emit("vehicleInfoChanged");
					this.getVehicleList(true);
				}).catch((err) => {
					uni.showToast({
						title: err || "设置失败",
						icon: "none"
					});
				}).finally(() => {
					uni.hideLoading();
					this.settingDefaultCarId = "";
				});
			},
			radioChange(e) {
				const vehicle = this.vehicleList.find(item => String(item.id) === String(e.detail.value));
				this.setDefaultVehicle(vehicle);
			},
			addVehicle() {
				this.form = emptyForm();
				this.recognitionMode = "";
				this.recognitionResult = null;
				this.recognitionMileage = "";
				this.plateChars = ["", "", "", "", "", "", "", ""];
				this.activePlateIndex = 0;
				this.plateResetKey += 1;
				this.addPageVisible = true;
				uni.setNavigationBarTitle({
					title: "添加车辆"
				});
				this.$nextTick(() => {
					this.activePlateIndex = 0;
					this.plateKeyboardVisible = true;
					this.setCarKeyboardMode(false);
					setTimeout(() => {
						this.activePlateIndex = 0;
						this.setCarKeyboardMode(false);
					}, 120);
				});
			},
			editVehicle(item) {
				getUserCarInfo(item.id).then((res) => {
					const detail = res.data || item;
					this.form = {
						...emptyForm(),
						...detail,
						mileage: detail.mileage !== undefined && detail.mileage !== null
							? detail.mileage
							: (detail.repKm !== undefined && detail.repKm !== null ? detail.repKm : "")
					};
					this.plateChars = String(this.form.carNo || "").split("").concat(["", "", "", "", "", "", "", ""]).slice(0, 8);
					this.formVisible = true;
				}).catch((err) => {
					uni.showToast({
						title: err || "获取详情失败",
						icon: "none"
					});
				});
			},
			delVehicle(index) {
				const vehicle = this.vehicleList[index];
				if (!vehicle) return;
				uni.showModal({
					content: "确定删除该车辆信息？",
					cancelText: "取消",
					confirmText: "确定",
					confirmColor: "#f55850",
					success: (res) => {
						if (!res.confirm) return;
						deleteUserCar(vehicle.id).then(() => {
							uni.showToast({
								title: "删除成功",
								icon: "success"
							});
							uni.$emit("vehicleInfoChanged");
							this.getVehicleList(true);
						}).catch((err) => {
							uni.showToast({
								title: err || "删除失败",
								icon: "none"
							});
						});
					}
				});
			},
			delVehicleById(id) {
				const index = this.vehicleList.findIndex(item => String(item.id) === String(id));
				if (index !== -1) this.delVehicle(index);
			},
			defaultChange(e) {
				this.form.isDefault = e.detail.value ? 1 : 0;
			},
			closeForm() {
				this.formVisible = false;
			},
			closeAddPage() {
				this.addPageVisible = false;
				this.plateKeyboardVisible = false;
				this.activePlateIndex = 0;
				uni.setNavigationBarTitle({
					title: "车辆管理"
				});
			},
			maxPlateLength() {
				return Number(this.form.isNewEnergy) === 1 ? 8 : 7;
			},
			setActivePlate(e) {
				const index = Number(e && e.currentTarget ? e.currentTarget.dataset.index : e);
				if (Number.isNaN(index)) return;
				this.activePlateIndex = index;
				this.plateKeyboardVisible = true;
				this.setCarKeyboardMode(index !== 0);
			},
			setNewEnergyPlate() {
				this.form.isNewEnergy = 1;
				if (this.recognitionMode !== "license") {
					this.recognitionMode = "";
					this.recognitionResult = null;
				}
				this.activePlateIndex = 7;
				this.plateKeyboardVisible = true;
				this.setCarKeyboardMode(true);
			},
			setCarKeyboardMode(isEnglish) {
				this.$nextTick(() => {
					setTimeout(() => {
						if (this.$refs.carKeyboard) {
							this.$refs.carKeyboard.abc = isEnglish;
						}
					}, 50);
				});
			},
			hidePlateKeyboard() {
				this.plateKeyboardVisible = false;
			},
			inputPlateKey(key) {
				const value = String(key || "").trim().toUpperCase();
				if (!this.validatePlateChar(value, this.activePlateIndex)) return;
				const chars = this.plateChars.slice();
				chars[this.activePlateIndex] = value;
				this.plateChars = chars;
				this.form.carNo = chars.slice(0, this.maxPlateLength()).join("");
				if (this.recognitionMode === "license" && this.recognitionResult) {
					this.$set(this.recognitionResult, "cusCarNo", this.form.carNo);
				} else {
					this.recognitionMode = "";
					this.recognitionResult = null;
				}
				const lastIndex = this.maxPlateLength() - 1;
				if (this.activePlateIndex < lastIndex) {
					this.activePlateIndex += 1;
					this.setCarKeyboardMode(this.activePlateIndex !== 0);
				}
			},
			deletePlateKey() {
				if (!this.plateChars.some(Boolean)) return;
				const chars = this.plateChars.slice();
				const deleteIndex = chars[this.activePlateIndex] ? this.activePlateIndex : Math.max(this.activePlateIndex - 1, 0);
				chars[deleteIndex] = "";
				this.plateChars = chars;
				this.form.carNo = chars.slice(0, this.maxPlateLength()).join("");
				if (this.recognitionMode === "license" && this.recognitionResult) {
					this.$set(this.recognitionResult, "cusCarNo", this.form.carNo);
				} else {
					this.recognitionMode = "";
					this.recognitionResult = null;
				}
				this.activePlateIndex = deleteIndex;
				this.setCarKeyboardMode(this.activePlateIndex !== 0);
			},
			showTodo() {
				uni.showToast({
					title: "暂未开放",
					icon: "none"
				});
			},
			recognizeVehicle() {
				if (this.recognizing) return;
				const carNo = this.normalizeCarNo(this.plateChars.slice(0, this.maxPlateLength()).join(""));
				this.form.carNo = carNo;
				if (!this.validateCarNo(carNo)) return;
				this.recognizing = true;
				this.recognitionResult = null;
				this.recognitionMileage = "";
				getCarInfoByCarNo(carNo).then((res) => {
					this.recognitionResult = res && res.data !== undefined ? res.data : res;
					if (!this.recognitionItems.length) {
						this.recognitionMode = "";
						this.showRecognitionFallback();
					} else {
						this.recognitionMode = "plate";
					}
				}).catch((err) => {
					const message = (err && (err.message || err.msg)) || err || "车型识别失败";
					if (/未识别|未找到|没有找到|无.*数据|不存在/.test(String(message))) {
						this.showRecognitionFallback();
						return;
					}
					uni.showToast({
						title: message,
						icon: "none"
					});
				}).finally(() => {
					this.recognizing = false;
				});
			},
			submitVehicle() {
				if (this.addPageVisible) {
					this.form.carNo = this.normalizeCarNo(this.plateChars.slice(0, this.maxPlateLength()).join(""));
				} else {
					this.form.carNo = this.normalizeCarNo(this.form.carNo);
				}
				if (!this.validateCarNo(this.form.carNo)) return;
				if (this.form.id && !this.form.brandName && !this.form.seriesName && !this.form.modelName) {
					uni.showToast({
						title: "请输入车辆信息",
						icon: "none"
					});
					return;
				}
				const payload = {
					...this.form,
					uid: this.form.uid || this.$store.state.app.uid || undefined,
					carYear: this.form.carYear ? Number(this.form.carYear) : undefined,
					mileage: this.form.mileage === "" ? undefined : Number(this.form.mileage),
					isDefault: Number(this.form.isDefault) === 1 ? 1 : 0,
					isNewEnergy: Number(this.form.isNewEnergy) === 1 ? 1 : 0
				};
				const isNewVehicle = !payload.id;
				const request = payload.id ? updateUserCar(payload.id, payload) : saveUserCar(payload);
				request.then(() => {
					uni.showToast({
						title: "保存成功",
						icon: "success"
					});
					uni.$emit("vehicleInfoChanged");
					this.formVisible = false;
					if (this.addPageVisible) this.closeAddPage();
					if (!isNewVehicle || !this.redirectToInquiryAfterSave()) {
						this.getVehicleList(true);
					}
				}).catch((err) => {
					uni.showToast({
						title: err || "保存失败",
						icon: "none"
					});
				});
			}
		}
	};
</script>

<style lang="scss" scoped>
	page {
		background: #f5f5f5;
	}

	.vehicle-management {
		padding: 20rpx 30rpx;
	}

	.vehicle-search {
		display: flex;
		align-items: center;
		height: 76rpx;
		margin-bottom: 20rpx;
		padding: 0 24rpx;
		background: #fff;
		border-radius: 38rpx;
		box-sizing: border-box;
	}

	.vehicle-search .iconfont {
		margin-right: 16rpx;
		font-size: 30rpx;
		color: #999;
	}

	.vehicle-search-input {
		flex: 1;
		height: 76rpx;
		min-width: 0;
		font-size: 28rpx;
		color: #333;
	}

	.vehicle-search-clear {
		width: 44rpx;
		font-size: 38rpx;
		line-height: 44rpx;
		text-align: right;
		color: #aaa;
	}

	.bg_color {
		@include main_bg_color(theme);
	}

	.add-car-page {
		min-height: 100vh;
		background: #fff;
		padding: 70rpx 44rpx 40rpx;
		box-sizing: border-box;
	}

	.plate-section {
		margin-bottom: 70rpx;
	}

	.add-title {
		font-size: 42rpx;
		color: #333;
		font-weight: 500;
		line-height: 58rpx;
	}

	.add-subtitle {
		font-size: 28rpx;
		color: #b7b7b7;
		margin-top: 14rpx;
	}

	.plate-row {
		position: relative;
		z-index: 200;
		display: flex;
		align-items: center;
		margin-top: 44rpx;
		gap: 8rpx;
	}

	.plate-box {
		position: relative;
		width: 68rpx;
		height: 96rpx;
		background: #f7f7f7;
		border: 2rpx solid #f7f7f7;
		border-radius: 8rpx;
		text-align: center;
		line-height: 92rpx;
		font-size: 34rpx;
		color: #333;
		box-sizing: border-box;
	}

	.plate-box.active {
		background: #fff;
		border-color: #ef3330;
	}

	.plate-box.special {
		color: #ef3330;
		background: #fff7f7;
		border-color: rgba(239, 51, 48, 0.55);
	}

	.plate-special-mark {
		position: absolute;
		right: 4rpx;
		top: 4rpx;
		min-width: 22rpx;
		height: 22rpx;
		padding: 0 4rpx;
		border-radius: 999rpx;
		background: #ef3330;
		color: #ffffff;
		font-size: 16rpx;
		font-weight: 500;
		line-height: 22rpx;
		text-align: center;
		box-sizing: border-box;
	}

	.new-energy {
		position: relative;
		width: 96rpx;
		height: 96rpx;
		border: 2rpx dashed #e9b9bf;
		border-radius: 10rpx;
		color: #e93b45;
		font-size: 22rpx;
		text-align: center;
		box-sizing: border-box;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
	}

	.new-energy.active {
		background: #fff1f2;
		border-style: solid;
		border-color: #ef3330;
		color: #ef3330;
	}

	.new-energy.special {
		background: #fff7f7;
		border-style: solid;
		border-color: rgba(239, 51, 48, 0.55);
		color: #ef3330;
	}

	.new-energy-value {
		font-size: 34rpx;
		color: #e93b45;
		line-height: 92rpx;
	}

	.new-energy-plus {
		font-size: 28rpx;
		font-weight: bold;
		line-height: 28rpx;
	}

	.auto-btn {
		height: 96rpx;
		border-radius: 48rpx;
		background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
		color: #fff;
		text-align: center;
		line-height: 96rpx;
		font-size: 34rpx;
		margin-top: 64rpx;
	}

	.auto-btn.disabled {
		opacity: 0.65;
	}

	.recognition-result {
		margin-top: 24rpx;
		padding: 26rpx 28rpx;
		background: #f8f8f8;
		border-radius: 14rpx;
	}

	.recognition-title {
		font-size: 30rpx;
		font-weight: 500;
		color: #333;
		margin-bottom: 12rpx;
	}

	.recognition-row {
		display: flex;
		align-items: center;
		font-size: 28rpx;
		min-height: 58rpx;
	}

	.recognition-label {
		width: 150rpx;
		flex-shrink: 0;
		color: #999;
	}

	.recognition-value {
		flex: 1;
		color: #333;
		word-break: break-all;
	}

	.recognition-input {
		flex: 1;
		height: 58rpx;
		min-width: 0;
		padding: 0 12rpx;
		border-bottom: 1rpx solid #ddd;
		box-sizing: border-box;
		font-size: 28rpx;
		color: #333;
	}

	.mileage-field {
		flex: 1;
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.mileage-input {
		min-width: 0;
	}

	.mileage-unit {
		flex-shrink: 0;
		margin-left: 12rpx;
		font-size: 26rpx;
		color: #999;
	}

	.recognition-submit {
		width: 480rpx;
		height: 80rpx;
		margin: 24rpx auto 0;
		border-radius: 40rpx;
		background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
		color: #fff;
		font-size: 30rpx;
		line-height: 80rpx;
		text-align: center;
	}

	.recognition-submit.disabled {
		opacity: 0.65;
	}

	.other-section {
		margin-top: 24rpx;
	}

	.other-title {
		font-size: 30rpx;
		color: #666;
		margin-bottom: 26rpx;
	}

	.other-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 32rpx;
	}

	.outline-btn {
		flex: 1;
		height: 88rpx;
		border: 1rpx solid #ddd;
		border-radius: 44rpx;
		text-align: center;
		line-height: 88rpx;
		font-size: 32rpx;
		color: #666;
	}

	.outline-btn.disabled {
		opacity: 0.65;
	}

	.vehicle-management .item {
		background-color: #fff;
		padding: 0 20rpx;
		margin-bottom: 20rpx;
	}

	.vehicle-management .item .vehicle-info {
		padding: 35rpx 0;
		border-bottom: 1rpx solid #eee;
		font-size: 28rpx;
		color: #282828;
		line-height: 42rpx;
	}

	.vehicle-management .item .vehicle-info .vehicle-name {
		font-size: 28rpx;
		font-weight: bold;
	}

	.vehicle-detail-row {
		display: flex;
		align-items: flex-start;
		min-height: 46rpx;
	}

	.vehicle-detail-label {
		width: 120rpx;
		flex-shrink: 0;
		color: #999;
	}

	.vehicle-detail-value {
		flex: 1;
		color: #282828;
		word-break: break-all;
	}

	.vehicle-management .item .operation {
		height: 83rpx;
		font-size: 28rpx;
		color: #282828;
	}

	.vehicle-management .item .operation .radio text {
		margin-left: 13rpx;
	}

	.vehicle-management .item .operation .iconfont {
		color: #2c2c2c;
		font-size: 35rpx;
		vertical-align: -2rpx;
		margin-right: 10rpx;
	}

	.vehicle-management .item .operation .iconfont.icon-shanchu {
		margin-left: 35rpx;
		font-size: 38rpx;
	}

	.loadingicon {
		font-size: 28rpx;
		color: #282828;
		margin-top: 40rpx;
	}

	.no-data {
		font-size: 28rpx;
		color: #999;
		text-align: center;
		padding-top: 120rpx;
	}

	.search-empty {
		padding-top: 80rpx;
	}

	.footer {
		position: fixed;
		width: 100%;
		background-color: #fff;
		bottom: 0;
		height: 106rpx;
		padding: 0 30rpx;
		box-sizing: border-box;
	}

	.footer .addressBnt {
		height: 76rpx;
		border-radius: 50rpx;
		text-align: center;
		line-height: 76rpx;
		font-size: 30rpx;
		color: #fff;
		background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
	}

	.footer .addressBnt.on {
		width: 690rpx;
		margin: 0 auto;
	}

	.footer .addressBnt .iconfont {
		font-size: 35rpx;
		margin-right: 8rpx;
		vertical-align: -1rpx;
	}

	.footer .addressBnt .add-plus {
		display: inline-block;
		margin-right: 12rpx;
		font-size: 42rpx;
		font-weight: 300;
		line-height: 70rpx;
		vertical-align: -4rpx;
	}

	.form-mask {
		position: fixed;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
		z-index: 99;
		background: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: flex-end;
	}

	.form-panel {
		width: 100%;
		background: #fff;
		border-radius: 24rpx 24rpx 0 0;
		padding: 32rpx 30rpx 42rpx;
		box-sizing: border-box;
	}

	.form-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #282828;
		text-align: center;
		margin-bottom: 24rpx;
	}

	.form-item {
		height: 88rpx;
		border-bottom: 1rpx solid #eee;
		display: flex;
		align-items: center;
		font-size: 28rpx;
		color: #282828;
	}

	.form-item text {
		width: 150rpx;
		flex-shrink: 0;
	}

	.form-item input {
		flex: 1;
		height: 88rpx;
		font-size: 28rpx;
	}

	.form-default {
		height: 96rpx;
		font-size: 28rpx;
		color: #282828;
	}

	.form-actions {
		margin-top: 22rpx;
	}

	.form-btn {
		width: 320rpx;
		height: 76rpx;
		border-radius: 50rpx;
		text-align: center;
		line-height: 76rpx;
		font-size: 30rpx;
	}

	.form-btn.cancel {
		background: #f5f5f5;
		color: #666;
	}

	.form-btn.confirm {
		color: #fff;
		background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
	}

	.plate-keyboard-panel {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 20;
		min-height: 500rpx;
		background: #e8e8e8;
	}

	.keyboard-toolbar {
		height: 72rpx;
		background: #e8e8e8;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 36rpx;
		box-sizing: border-box;
		font-size: 28rpx;
		color: #ef3330;
	}

	/deep/ radio .wx-radio-input.wx-radio-input-checked {
		@include main_bg_color(theme);
		@include coupons_border_color(theme);
	}

	/deep/ radio .uni-radio-input.uni-radio-input-checked {
		@include main_bg_color(theme);
		border: none !important;
	}
</style>
