var timerArray = [],
	userOpenid = '',
	speedNormal = 0,
	speedQuick = 0,
	speedSlow = 0,
	runSpeed = 0,
	runDistance = 0, //100米长度
	obstacleTimer = '', //障碍物作用的定时器
	startLineHeight = 0,
	swipeLock = true, //人物滑动锁定
	giftListLock = false, //礼品列表弹出锁定
	vertigoMs = 2000, //眩晕毫秒数
	manAnimateTimer = 0, //人物动画定时器
	isSubmitUserInfo = false, //是否提交过用户信息
	afId = '';

//初始化AnimationFrame
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
}());

$(document).ready(function() {
	$('body').show();
	_initLoader();
	_initData();
});

var vm = avalon.define({
	$id: 'parkour',
	alertText: '',
	runwayPosition: 0, //跑到位置
	timeCount: 0, //计时毫秒数
	costSeconds: 0, //跑步时显示的时间
	manState: 'nm', //人物状态
	manToggleType: 1, //人物动画帧
	manToggleInterval: 130, //人物动画切换毫秒
	curIntegral: 0, //当前积分
	totalLife: 100, //总生命
	totalIntegral: 0, //总积分
	preloadPercent: 0, //预加载百分比
	friendsList: [], //帮助好友列表
	friendsNum: 0, //帮助好友人数
	userName: '', //用户名称
	vertigoTime: '2s', //眩晕作用剩余时间
	baseScore: 0, //基础分数
	timeScore: 0, //时间奖励
	giftList: [], //总共奖品列表
	myGiftList: [], //我的礼品列表
	broadcastList: [], //公告列表
	totalGameScore: 0, //本次游戏获得的总积分
	accidentPrompt: '', //意外提示
	frameRate: 0 //帧率
});

//跑步计时
function _runTime() {
	var runTimerId = setInterval(function() {
		vm.timeCount += 31;
		vm.costSeconds = _formatSecond(vm.timeCount);
	}, 31);
	timerArray.push(runTimerId);
}

function _formatSecond(ms) {
	return Math.floor(ms / 1000) + '.' + Math.floor((ms % 1000) / 100) + ((ms % 10) > 0 ? (ms % 10) : 0);
}

//初始化跑步界面的组件尺寸
function _initRunview() {
	$('#obstacle-prompt').height($('#obstacle-prompt').width() * 160 / 300);
}

//预加载图片
function _initLoader() {
	var loader = new resLoader({
		resources : [
			'./img/article/accelerator.png',
			'./img/article/bomb.png',
			'./img/article/car.png',
			'./img/article/pool.png',
			'./img/article/roadblock.png',
			'./img/article/star.png',
			'./img/countdown_bg_1.png',
			'./img/countdown_bg_2.png',
			'./img/countdown_bg_3.png',
			'./img/game_head_bg.png',
			'./img/head_bg.png',
			'./img/main_bg.jpg',
			'./img/new_bg.jpg',
			'./img/main_bottom_bg.png',
			'./img/main_obstacle.png',
			'./img/person_die_1.png',
			'./img/person_die_2.png',
			'./img/person_nm_1.png',
			'./img/person_nm_2.png',
			'./img/person_sl_1.png',
			'./img/person_sl_2.png',
			'./img/person_sp_1.png',
			'./img/person_sp_2.png',
			'./img/person_st_1.png',
			'./img/person_st_2.png',
			'./img/runway_bg.jpg',
			'./img/runway_start.jpg',
			'./img/toggle_way.png',
			'./img/friend_bg.png',
			'./img/rule_bg.png',
			'./img/lucky_main.png',
			'./img/gameover_bg.png',
			'./img/loading.png',
			'./img/lucky_btn_begin.png',
			'./img/share_content.png',
			'./img/card_back.png',
			'./img/rule_bg.png',
			'./img/draw_failed_bg.png',
			'./img/draw_result.png',
			'./img/draw_result_real.png',
			'./img/gift_list_bg.png',
			'./img/input_arrow.png',
			'./img/mygift_bg.png',
			'./img/lucky_btn_loading.png',
			'./img/destination_bg.png',
			'./img/rule.jpg',
			'./img/gift_list.jpg',
		],
		onProgress : function(current, total) {
			vm.preloadPercent = Math.floor(current / total * 100);
		},
		onComplete : function(total) {
			$('#load-progress').hide();
			$('#main-bottom').show();

			//图片加载完成后才能加载canvas
			gameMonitor.init();
		}
	});

	loader.start();
}

function _initData() {
	var deviceWidth = $(window).width();
	$('body').height($(window).height());

	//绘制首页底部
	$('#main-bottom').height(deviceWidth * 504 / 640);
}

//初始化首页广播
function _initBroadcast() {
	var marginLeft = 0,
		curIndex = 0;

	$('#broadcast').css('visibility', 'hidden');
	setTimeout(function () {
		$('#broadcast').css('visibility', 'visible');
	}, 500);

	var broadcastTimer = setInterval(function () {
		if ($('#broadcast .broadcast-slide').length < 1) {
			return false;
		}
		var wrapperWidth = 0;
		$('#broadcast .broadcast-slide').each(function () {
			//因为每个slide的margin-left为20px，所以这里要加20，outerWidth没生效
			wrapperWidth += ($(this).width() + 20);
		});
		$('#broadcast .broadcast-wrapper').width(wrapperWidth);
		marginLeft -= 3;
		$('#broadcast .broadcast-wrapper').css('margin-left', marginLeft + 'px');
		var secondSlideLeft = $('#broadcast .broadcast-slide').eq(curIndex + 1).offset().left;
		if (secondSlideLeft < 0) {
			var html = '<div class="broadcast-slide">' + $('#broadcast .broadcast-slide').eq(curIndex).html() + '</div>';
			$('#broadcast .broadcast-wrapper').append(html);
			var lastSlideWidth = $('#broadcast .broadcast-slide').eq(curIndex).width() + 20,
				curWrapperWidth = $('#broadcast .broadcast-wrapper').width();
			$('#broadcast .broadcast-wrapper').width(curWrapperWidth + lastSlideWidth);
			curIndex++;
		}
	}, 100);
	timerArray.push(broadcastTimer);
}

//结束游戏
function _gameover() {
	$('#popup-game-result').show();
	$('#popup-container').show();
	_resizePopup();
}

function _resizePopup() {
	$('#popup-rule').height($('#popup-rule').width() * 829 / 581);
	$('#popup-friend').height($('#popup-friend').width() * 729 / 581);
	$('#popup-lucky').height($('#popup-lucky').width() * 709 / 583);
	$('#popup-game-result').height($('#popup-game-result').width() * 709 / 583);
	$('#gift-list').height($('#gift-list').width() * 750 / 501);
	$('#draw-result').height($('#draw-result').width());
	$('#popup-my-gift').height($('#popup-my-gift').width() * 709 /583);
	$('#draw-failed').height($('#draw-failed').width() * 360 / 501);
	$('#draw-result-real').height($('#draw-result-real').width() * 841 / 581);
}

function _alert(content) {
	vm.alertText = content;
	$('#alert').show();
	setTimeout(function () {
		$('#alert').hide();
	}, 2000);
}

//游戏规则
function handleShowRule() {
	$('#popup-rule').show();
	$('#popup-container').show();
	_resizePopup();
}

//帮助好友
function handleShowFriends() {
	$('#popup-friend').show();
	$('#popup-container').show();
	_resizePopup();
}

//打开抽奖
function handleShowLucky() {
	$('#popup-lucky').show();
	$('#popup-container').show();
	_resizePopup();
}

//关闭弹出窗口
function handleClosePopup(target) {
	$('#popup-container .popup-item').hide();
	$('#popup-container').hide();
}

//打开和关闭分享提示
function showSharePrompt() {
	$('#get-life').show();
}

function handleHideSharePrompt() {
	$('#get-life').hide();
}

//返回首页，还原数据
function handleReturnMain() {
	if (manAnimateTimer) {
		clearInterval(manAnimateTimer);
		manAnimateTimer = 0;
	}
	$('#running-man').removeClass('left').removeClass('right');
	$('#count-down').attr('class', 'bg-3');
	vm.manState = 'nm';
	vm.totalGameScore = vm.costSeconds = vm.timeCount = vm.runwayPosition = vm.baseScore = vm.curIntegral = vm.timeScore = 0;
	$('#view-main').show();
	$('#view-game').hide();
	handleClosePopup();
	_initBroadcast();
	gameMonitor.init();
}

//开始抽奖，每隔1秒从左到右翻牌
function handleBeginDraw() {
	if (vm.totalIntegral < 100) {
		_alert('您当前的积分不足，请参与跑步积分赛获取积分。');
		return;
	}
	if ($('#popup-lucky .btn-begin-luck').hasClass('loading')) {
		return;
	}
	giftListLock = true;
	vm.totalIntegral -= 100;
	$('#popup-lucky .game-item img').prop('src', './img/card_back.png');
	$('#popup-lucky .btn-begin-luck').addClass('loading');
	$.ajax({
		url: '/dubbo_api/mll/olympicRun/luckyDraw',
		type: 'GET',
		dataType: 'json',
		data: {},
	})
	.done(function(json) {
		//error2为不中奖，0为中奖，1为错误
		if (json.error == 1) {
			_alert(json.msg);
			$('#popup-lucky .btn-begin-luck').removeClass('loading');
			giftListLock = false;
		} else if (json.error == 2) {
			_showDrawResult(0, json.goodsName);
			$('#popup-lucky .btn-begin-luck').removeClass('loading');
			giftListLock = false;
		} else {
			var giftImg = $$.__IMG + '/' + json.goodsPic;
			var giftLoadImg = new Image();
			giftLoadImg.src = giftImg;
			giftLoadImg.onload = function () {
				$('#popup-lucky .game-item').eq(0).addClass('back');
				setTimeout(function () {
					$('#popup-lucky .game-item img').eq(0).prop('src', giftImg);
					$('#popup-lucky .game-item').eq(0).removeClass('back');
				}, 600);

				setTimeout(function () {
					$('#popup-lucky .game-item').eq(1).addClass('back');
					setTimeout(function () {
						$('#popup-lucky .game-item img').eq(1).prop('src', giftImg);
						$('#popup-lucky .game-item').eq(1).removeClass('back');
					}, 600);
				}, 1000);

				setTimeout(function () {
					$('#popup-lucky .game-item').eq(2).addClass('back');
					setTimeout(function () {
						$('#popup-lucky .game-item img').eq(2).prop('src', giftImg);
						$('#popup-lucky .game-item').eq(2).removeClass('back');
						setTimeout(function () {
							$('#popup-lucky .btn-begin-luck').removeClass('loading');
							var goodType = json.goodsType == 0 ? 2 : 1;
							_showDrawResult(goodType, json.goodsName, json);
							giftListLock = false;
						}, 500);
					}, 600);
				}, 2000);
			}
		}
	});
}

function _showDrawResult(type, content, jsonData) {
	//0未中奖，1虚拟奖，2实物奖
	if (type == 0) {
		_showSecondaryPopup('draw-failed');
	} else if (type == 1) {
		$('#draw-result .value').text(content);
		_showSecondaryPopup('draw-result');
		handleClosePopup();
	} else if (type == 2) {
		_showDrawRealPopup(content, jsonData);
		handleClosePopup();
	}
}

//显示实物领奖
function _showDrawRealPopup(content, jsonData) {
	$('#draw-result-real .text').text(content);
	_showSecondaryPopup('draw-result-real');

	if (jsonData.userInfo) {
		$('#user-name').val(jsonData.userInfo.realName);
		$('#user-phone').val(jsonData.userInfo.mobile);
		$('#user-expr').val(jsonData.userInfo.exprName);

		$('#user-info .draw-result-input').prop('disabled', 'disabled');
		$('#user-info').click(function () {
			_alert('您已经设置过领奖信息，不能重复设置哦！');
		});
		isSubmitUserInfo = true;

		return false;
	}

	$('#user-phone').on('keyup', function () {
		var inputVal = $(this).val();
		if (/(13|14|15|18|17)[0-9]{9}/.test(inputVal)) {
			$.ajax({
				url: '/dubbo_api/mll/eurocup/getExprAddr',
				type: 'GET',
				dataType: 'json',
				data: {mobile: inputVal},
				success:function(data){
					if (data.error === 0) {
						var cityId = data.cityId;
						var provinceId = data.provinceId;
						$.ajax({
							url: '/mll_api/ajax_ajax.html?act=getSmsExprList',
							type: 'GET',
							dataType: 'json',
							success:function(data){
								var listObj = data[provinceId].cityList[cityId];
								var keys,value;
								if (listObj) {
									listObj = listObj.exprList;
									keys = Object.keys(listObj)[0];
									value = listObj[keys];
								}else{
									listObj = data[provinceId].cityList;
									keys = Object.keys(listObj)[0];
									listObj = data[provinceId].cityList[keys].exprList;
									keys = Object.keys(listObj)[0];
									value = listObj[keys];
								}
								$('#user-expr').val(value);
								$('#user-expr').data('exprid',keys);
							}
						});
					}
				}
			});
		}
	});

	$('#user-expr-container').off('click').on('click', function() {
		event.preventDefault();
		if (jsonData.userInfo) {
			return false;
		}
        setTimeout(function () {
        	new GSlider();
        }, 200);
	});
}

//提交实物领奖
function handleSubmitUserMsg() {
	if (isSubmitUserInfo) {
		handleCloseDrawPopup();
		return false;
	}

	var name = $('#user-name').val(),
		phone = $('#user-phone').val(),
		exprId = $('#user-expr').data('exprid');

	if (name.length < 1) {
		_alert('请填写姓名！');
		return false;
	}
	if (phone.length < 1) {
		_alert('请填写手机号！');
		return false;
	}
	if (phone.length != 11) {
		_alert('请输入正确的手机号！');
		return false;
	}
	if (!/(13|14|15|18|17)[0-9]{9}/.test(phone)) {
		_alert('请输入正确的手机号！');
		return false;
	}
	if (!exprId) {
		_alert('请选择体验馆！');
		return false;
	}

	$.ajax({
		url: '/dubbo_api/mll/olympicRun/addreceiveBaseInfo',
		type: 'POST',
		dataType: 'json',
		data: {
			realName: name,
			mobile: phone,
			exprId: exprId
		},
	})
	.done(function(json) {
		if (json.error) {
			_alert(json.msg);
		} else {
			_alert('领奖信息提交成功！');
		}
	});
	handleCloseDrawPopup();
}

//关闭抽奖结果弹出窗口
function handleCloseDrawPopup() {
	handleCloseSecondaryPopup();
	$('#popup-lucky .game-item img').prop('src', './img/card_back.png');
}

//展现礼品列表
function handleShowAllGift() {
	if (giftListLock) {
		return false;
	}
	$('#popup-secondary').show();
	$('#gift-list').show();
	_resizePopup();
}

function _showSecondaryPopup(id) {
	$('#popup-secondary').show();
	$('#' + id).show();
	_resizePopup();
}

function handleCloseSecondaryPopup() {
	$('#popup-secondary').hide();
	$('.secondary-popup-item').hide();
}

function handleCloseDraw() {
	$('#popup-lucky .game-item img').prop('src', './img/card_back.png');
	handleClosePopup();
}

//打开我的礼品
function handleShowMyGift() {
	$('#popup-my-gift').show();
	$('#popup-container').show();
	_resizePopup();
	$.ajax({
		url: '/dubbo_api/mll/olympicRun/getMyPrizeList',
		type: 'GET',
		dataType: 'json',
		data: {},
	})
	.done(function(json) {
		if (json.prizesList) {
			vm.myGiftList = json.prizesList;
		}
	});
}

//初始化微信分享
function _initWechat(focusImg, shareMsg) {
	wx.onMenuShareAppMessage({
		title: shareMsg.subject, // 分享标题
	    desc: shareMsg.subhead, // 分享描述
	    link: 'http://m.meilele.com/dubbo_api/mll/wx/act/aypbPageshare?sourceid=' + userOpenid + '&from_id=' + window.fromId, // 分享链接
	    imgUrl: focusImg, // 分享图标
	    type: '', // 分享类型,music、video或link，不填默认为link
	    dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
	    success: function () {
	        // 用户确认分享后执行的回调函数
	    },
	    cancel: function () {
	        // 用户取消分享后执行的回调函数
	    }
	});

	wx.onMenuShareTimeline({
	    title: shareMsg.subject, // 分享标题
	    link: 'http://m.meilele.com/dubbo_api/mll/wx/act/aypbPageshare?sourceid=' + userOpenid + '&from_id=' + window.fromId, // 分享链接
	    imgUrl: focusImg, // 分享图标
	    success: function () {
	        // 用户确认分享后执行的回调函数
	    },
	    cancel: function () {
	        // 用户取消分享后执行的回调函数
	    }
	});
}

var blockData = {
	star: {
		width: 0.4,
		height: 79 / 85,
		src: './img/article/star.png'
	},
	speed: {
		width: 0.34,
		height: 78 / 70,
		src: './img/article/accelerator.png'
	},
	roadblock: {
		width: 0.7,
		height: 63 / 142,
		src: './img/article/roadblock.png'
	},
	bomb: {
		width: 0.5,
		height: 97 / 93,
		src: './img/article/bomb.png'
	},
	pool: {
		width: 0.7,
		height: 63 / 145,
		src: './img/article/pool.png'
	},
	car: {
		width: 0.5,
		height: 76 / 98,
		src: './img/article/car.png'
	}
}

var Block = function (type, left, top, width, height, src, id) {
	var blockImg = new Image();
	blockImg.src = src;
	this.type = type;
	this.left = left;
	this.top = top;
	this.width = width;
	this.height = height;
	this.src = blockImg;
	this.id = id;
	this.isShow = false;
}

Block.prototype.paint = function(ctx){
	var _this = this;
	this.src.onload = function () {
		ctx.drawImage(_this.src, _this.left, _this.top, _this.width, _this.height);
	}
};

Block.prototype.move = function(ctx) {
	this.top += gameMonitor.bgSpeed;
	if(this.top > gameMonitor.h){
	 	gameMonitor.blockList[this.id] = null;
	}
	else if (this.top > 0) {
		this.isShow = true;
		ctx.drawImage(this.src, this.left, this.top, this.width, this.height);
	}
};

var Scale = function (ordinate, num) {
	this.ordinate = ordinate;
	this.text = '-' + num + 'm';
}

Scale.prototype.move = function(ctx) {
	this.ordinate += gameMonitor.bgSpeed;
	if (this.ordinate > 0 && this.ordinate < gameMonitor.h) {
		ctx.fillText(this.text, 0, this.ordinate);
	}
};

var gameMonitor = {
	w: $(window).width(),
	h: $(window).height(),
	bgDistance: 0,
	bgAdditionHeight: 0, //bgAddition是跑道附加素材
	bgAdditionDistance: 0,
	runner: {},
	frameCount: 0,
	swipeLock: true,
	totalDistance: 0,
	runwayLength: 0,
	bgSpeed: 0,
	baseSpeed: 0, //基础速度，bgSpeed在此基础上根据帧率发生变化
	blockList: [],
	runActTimer: '',
	startLineHeight: 0,
	scaleHeight: 0,
	scaleList: [],
	isInit: false,
	speedNormal: 0,
	speedFast: 0,
	speedSlow: 0,
	collisionTimer: '',
	endLine: {},
	rafId: '',
	lastTime: 0,
	init: function () {
		var _this = this, html = '';

		this.lastTime = 0;
		this.w = $(window).width();
		this.h = $(window).height();
		if (!this.isInit) {
			html += '<canvas id="stage" width="' + this.w + '" height="' + this.h + '"></canvas>';
			$('#view-game').append(html);
		}
		
		var canvas = document.getElementById('stage');
		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, _this.w, _this.h);

		this.totalDistance = this.runwayLength = this.w * 15; //跑道长度是宽度15倍
		this.baseSpeed = this.speedNormal = this.bgSpeed = Math.round(this.runwayLength / 1500); //25秒完成游戏，一秒60帧
		this.speedFast = Math.round(this.speedNormal * 7 / 4);
		this.speedSlow = Math.round(this.speedNormal / 4);

		this.startLineHeight = this.w * 120 / 640;
		this.scaleHeight = this.runwayLength / 20;

		this.initBg(ctx);
		this.initEndline();
		if (!this.isInit) {
			this.initListener(ctx);
			this.isInit = true;
		}
	},
	initBg: function (ctx) {
		var _this = this, bgAddition = new Image();

		this.bgDistance = 0;
		this.bg = new Image();
		this.bg.src = './img/new_bg.jpg';
		this.bg.onload= function () {
			ctx.drawImage(_this.bg, 0, 0, _this.w, _this.h);
		}

		bgAddition.src = './img/runway_bg.jpg';
		this.bgAddition = bgAddition;
		this.bgAdditionHeight = this.w * 721 / 640;
		this.bgAdditionDistance = 0 - this.bgAdditionHeight;

		this.initScale(ctx);
		this.initBlock(ctx, function (ctx) {
			_this.initRunner(ctx);
		});
	},
	initEndline: function (ctx) {
		this.endLine = new Image();
		this.endLine.src = './img/destination_bg.png';
		this.endLine.height = this.w / 660 * 109;
	},
	initScale: function (ctx) {
		//刻度高度
		ctx.font = 'bold 18px 苹方';
		ctx.fillStyle = '#d26b60';
		ctx.fillText('-5m', 0, this.h - this.startLineHeight - this.scaleHeight);
		ctx.fillText('-10m', 0, this.h - this.startLineHeight - this.scaleHeight * 2);

		this.scaleList = [];
		for (var i = 1; i <= 20; i++) {
			var ordinate = this.h - this.startLineHeight - this.scaleHeight * i;
			var scaleItem = new Scale(ordinate, 5 * i);
			this.scaleList.push(scaleItem);
		}
	},
	initRunner: function (ctx) {
		var _this = this;
		this.runner = new Object();
		//按照图片尺寸设定人物宽高
		this.runner.size = [this.w * 0.2, this.w * 0.2 * 190 / 130];
		this.runner.centerPositon = (this.w - this.runner.size[0]) / 2;
		this.runner.leftPosition = (this.w / 3 - this.runner.size[0]) / 2;
		this.runner.rightPositon = this.w / 3 * 2 + (this.w / 3 - this.runner.size[0]) / 2;
		this.runner.positon = [this.runner.centerPositon, this.h - this.runner.size[1]];
		this.runner.animateState = 1;

		var runnerImg = {
			normal: './img/person_nm_',
			fast: './img/person_sp_',
			slow: './img/person_sl_',
			stop: './img/person_st_',
			die: './img/person_die_'
		}

		for (var key in runnerImg) {
			this.runner[key] = new Object();
			for (var i = 1; i < 3; i++) {
				this.runner[key][i] = new Image();
				this.runner[key][i].src = runnerImg[key] + i + '.png';
			}
		}
		this.runner.curState = 'normal';

		this.runner.normal[1].onload = function () {
			ctx.drawImage(_this.runner.normal[1], _this.runner.positon[0], _this.runner.positon[1], _this.runner.size[0], _this.runner.size[1]);
		}
	},
	initListener: function (ctx) {
		var _this = this;
		
		$('#btn-begin').click(function () {
			if (vm.totalLife < 1) {
				_alert('您当前的生命值不足，请点击右上角分享，邀请好友获取生命值。');
				return;
			}
			vm.totalLife--;

			$('#view-main').hide();
			$('#view-game').show();
			$('#count-down').show();
			var readyCountNum = 3;
			var readyCountTimer = setInterval(function () {
				readyCountNum--;
				if (readyCountNum == 0) {
					clearInterval(readyCountTimer);
					$('#count-down').hide();
					_this.run(ctx);
					_runTime();
				} else {
					$('#count-down').attr('class', 'bg-' + readyCountNum);
				}
			}, 1000);
		});
		this.initTouchEvent();
	},
	initTouchEvent: function () {
		var _this = this;
		touch.on('#view-game', 'touchstart', function (ev) {
			ev.preventDefault();
		});
		touch.on('#view-game', 'swipeup', function(ev) {
			ev.preventDefault();
		});
		touch.on('#view-game', 'swipedown', function(ev) {
			ev.preventDefault();
		});
		touch.on('#view-game', 'swipeleft', function(ev) {
			ev.preventDefault();
			if (_this.swipeLock) {
				return false;
			}
			if (_this.runner.swipeState == 'left') {
				return false;
			} else if (_this.runner.swipeState == 'right') {
				_this.runner.swipeState = 'center';
				_this.runner.positon[0] = _this.runner.centerPositon;
			} else {
				_this.runner.swipeState = 'left';
				_this.runner.positon[0] = _this.runner.leftPosition;
			}
		});
		touch.on('#view-game', 'swiperight', function(ev) {
			ev.preventDefault();
			if (_this.swipeLock) {
				return false;
			}
			if (_this.runner.swipeState == 'left') {
				_this.runner.swipeState = 'center';
				_this.runner.positon[0] = _this.runner.centerPositon;
			} else if (_this.runner.swipeState == 'right') {
				return false;
			} else {
				_this.runner.swipeState = 'right';
				_this.runner.positon[0] = _this.runner.rightPositon;
			}
		});
	},
	initBlock: function (ctx, callback) {
		var _this = this;
		_this.blockList = [];

		var blockIndex = 0,
			runwayDataList = [];
		if (Math.random() > 0.5) {
			runwayDataList = [[{"type":"star","row":6},{"type":"roadblock","row":13},{"type":"star","row":22},{"type":"pool","row":26},{"type":"star","row":35},{"type":"speed","row":37},{"type":"speed","row":44},{"type":"star","row":56},{"type":"car","row":71},{"type":"speed","row":80},{"type":"star","row":83},{"type":"pool","row":88},{"type":"pool","row":97},{"type":"star","row":99}],[{"type":"star","row":1},{"type":"star","row":5},{"type":"star","row":8},{"type":"star","row":10},{"type":"star","row":16},{"type":"star","row":45},{"type":"star","row":51},{"type":"pool","row":58},{"type":"pool","row":65},{"type":"star","row":68},{"type":"star","row":73},{"type":"star","row":75},{"type":"star","row":76},{"type":"speed","row":77},{"type":"speed","row":84},{"type":"pool","row":90},{"type":"star","row":97}],[{"type":"roadblock","row":9},{"type":"roadblock","row":25},{"type":"star","row":28},{"type":"star","row":35},{"type":"star","row":37},{"type":"star","row":38},{"type":"speed","row":41},{"type":"star","row":42},{"type":"star","row":48},{"type":"roadblock","row":55},{"type":"star","row":58},{"type":"star","row":64},{"type":"pool","row":72},{"type":"star","row":74},{"type":"pool","row":78},{"type":"star","row":83},{"type":"bomb","row":86}]];
		} else {
			runwayDataList = [[{"type":"star","row":1},{"type":"star","row":15},{"type":"speed","row":31},{"type":"speed","row":39},{"type":"star","row":41},{"type":"star","row":45},{"type":"star","row":49},{"type":"star","row":55},{"type":"pool","row":61},{"type":"star","row":63},{"type":"speed","row":70},{"type":"star","row":73},{"type":"car","row":76},{"type":"star","row":79},{"type":"star","row":81},{"type":"roadblock","row":84},{"type":"star","row":88},{"type":"star","row":89},{"type":"speed","row":94}],[{"type":"star","row":1},{"type":"star","row":8},{"type":"star","row":30},{"type":"pool","row":34},{"type":"star","row":38},{"type":"star","row":39},{"type":"bomb","row":46},{"type":"star","row":49},{"type":"pool","row":52},{"type":"star","row":57},{"type":"speed","row":59},{"type":"star","row":61},{"type":"pool","row":75},{"type":"star","row":79},{"type":"star","row":82},{"type":"roadblock","row":87},{"type":"speed","row":96}],[{"type":"star","row":5},{"type":"star","row":8},{"type":"pool","row":21},{"type":"star","row":23},{"type":"star","row":25},{"type":"star","row":31},{"type":"pool","row":35},{"type":"roadblock","row":55},{"type":"roadblock","row":64},{"type":"pool","row":72},{"type":"star","row":76},{"type":"pool","row":82}]];
		}
		$.each(runwayDataList, function(runwayIndex, runwayData) {
			var baseLeftDistance = 0, lineWidth = _this.w / 3;
			if (runwayIndex == 0) {
				baseLeftDistance = 0;
			} else if (runwayIndex == 1) {
				baseLeftDistance = lineWidth;
			} else {
				baseLeftDistance = lineWidth * 2;
			}

			$.each(runwayData, function(index, val) {
				 var curBlockData = blockData[val.type],
				 itemWidth = curBlockData.width * lineWidth;
				 var blockItem = new Block(
				 	val.type,
				 	(lineWidth - itemWidth) / 2 + baseLeftDistance,
				 	_this.h - (val.row / 100) * _this.runwayLength - _this.startLineHeight,
				 	curBlockData.width * lineWidth,
				 	itemWidth * curBlockData.height,
				 	curBlockData.src,
				 	blockIndex++
				 );
				 _this.blockList.push(blockItem);
			});
		});
		
		for (var i = 0; i < _this.blockList.length; i++) {
			var blockItem = _this.blockList[i];
			if (blockItem) {
				blockItem.paint(ctx);
			}
		}
		callback(ctx);
	},
	rollBg: function (ctx) {
		this.bgDistance += this.bgSpeed;
		if (this.bgDistance < this.h) {
			ctx.drawImage(this.bg, 0, this.bgDistance, this.w, this.h);
		}

		this.bgAdditionDistance += this.bgSpeed;
		for (var i = 0; i < 100; i++) {
			ctx.drawImage(this.bgAddition, 0, this.bgAdditionDistance - i * this.bgAdditionHeight, this.w, this.bgAdditionHeight);
			if (this.bgAdditionDistance - i * this.bgAdditionHeight <= 0) {
				break;
			}
		}
	},
	drawRunner: function (ctx) {
		if (this.frameCount % 10 == 0) {
			this.runner.animateState == 1 ? this.runner.animateState = 2 : this.runner.animateState = 1;
		}
		ctx.drawImage(this.runner[this.runner.curState][this.runner.animateState], this.runner.positon[0], this.runner.positon[1], this.runner.size[0], this.runner.size[1]);
	},
	drawScale: function () {
		ctx.fillText('-10m', 0, this.h - this.startLineHeight - this.scaleHeight * 2);
	},
	//碰撞检测
	collisionTest: function () {
		for (var i = 0; i < this.blockList.length; i++) {
			if (this.blockList[i] && this.blockList[i].isShow) {
				var blockItem = this.blockList[i],
					//小人中心点坐标
					runnerHoriCenterCord = [this.runner.positon[0] + this.runner.size[0] / 2, this.runner.positon[1] + this.runner.size[1] / 2],
					//障碍物中心点坐标
					blockHoriCenterCord = [blockItem.left + blockItem.width / 2, blockItem.top + blockItem.height / 2];

				if (Math.abs(runnerHoriCenterCord[0] - blockHoriCenterCord[0]) < (this.runner.size[0] + blockItem.width) / 2 && Math.abs(runnerHoriCenterCord[1] - blockHoriCenterCord[1]) < (this.runner.size[1] + blockItem.height) / 2) {
					this.handleCollision(blockItem.type);
					this.blockList[i] = null;
				}
			}
		}
	},
	handleCollision: function (type) {
		var _this = this;
		if (type == 'star') {
			vm.curIntegral++;
		} else if (type == 'speed') {
			this.baseSpeed = this.speedFast;
			this.runner.curState = 'fast';
			this.collisionRecover();
		} else if (type == 'roadblock') {
			this.baseSpeed = 0;
			this.runner.curState = 'stop';
			this.swipeLock = true;
			$('#obstacle-prompt').show();
			$('#obstacle-prompt').height($('#obstacle-prompt').width() * 160 / 300);
			var vertigoTimer = setInterval(function () {
				vertigoMs -= 100;
				vm.vertigoTime = vertigoMs % 1000 > 0 ? vertigoMs / 1000 : vertigoMs / 1000 + '.0';
				if (vertigoMs <= 0) {
					vm.manState = 'nm';
					_this.swipeLock = false;
					$('#obstacle-prompt').hide();
					vertigoMs = 2000;
					clearInterval(vertigoTimer);
				}
			}, 100);
			this.collisionRecover();
		} else if (type == 'pool') {
			this.baseSpeed = this.speedSlow;
			this.runner.curState = 'slow';
			this.collisionRecover();
		} else if (type == 'car' || type == 'bomb') {
			this.baseSpeed = 0;
			this.runner.size = [this.w * 0.2, this.w * 0.2 * 159 / 143];
			this.runner.curState = 'die';
			this.swipeLock = true;
			setTimeout(function () {
				_this.endRun();
			}, 300);
		}
	},
	collisionRecover: function () {
		var _this = this;
		if (this.collisionTimer) {
			clearTimeout(this.collisionTimer);
		}
		this.collisionTimer = setTimeout(function () {
			_this.runner.curState = 'normal';
			_this.baseSpeed = _this.speedNormal;
			_this.swipeLock = false;
		}, 2000);
	},
	drawEndLine: function (ctx) {
		if (this.runwayLength + this.runner.size[1] + this.h > 0) {
			ctx.drawImage(this.endLine, 0, 0 - (this.runwayLength + this.runner.size[1]) + this.h, this.w, this.endLine.height);
		}
	},
	run: function (ctx) {
		var _this = this;
		_this.swipeLock = false;

		function animateRun () {
			var curTime = new Date().getTime();
			if (_this.lastTime > 0) {
				_this.bgSpeed = _this.baseSpeed * (60 * (curTime - _this.lastTime) / 1000);
			}
			_this.lastTime = curTime;

			//注意顺序，先画背景，再画终点线，再画刻度，再画障碍物，最后画人物
			ctx.clearRect(0, 0, _this.w, _this.h);

			_this.rollBg(ctx);
			_this.drawEndLine(ctx);

			for (var i = 0; i < _this.scaleList.length; i++) {
				var scaleItem = _this.scaleList[i];
				if (scaleItem) {
					scaleItem.move(ctx);
				}
			}

			for (var i = 0; i < _this.blockList.length; i++) {
				var blockItem = _this.blockList[i];
				if (blockItem) {
					blockItem.move(ctx);
				}
			}

			_this.frameCount++;

			_this.drawRunner(ctx);

			if (_this.frameCount % 5 == 0) {
				_this.collisionTest();
			}
			_this.runwayLength -= _this.bgSpeed;
			if (_this.runwayLength + _this.runner.size[1] <= 0) {
				_this.endRun();
				return false;
			}

			_this.rafId = window.requestAnimationFrame(animateRun);
		}
		animateRun();
	},
	endRun: function () {
		for (var i = 0; i < timerArray.length; i++) {
			clearInterval(timerArray[i]);
		}
		window.cancelAnimationFrame(this.rafId);
		this.swipeLock = true;
		//记录分数
		var surplusLength = this.runwayLength + this.runner.size[1] < 0 ? 0 : this.runwayLength + this.runner.size[1];
		vm.baseScore = Math.floor(80 * (1 - surplusLength / (this.totalDistance + this.runner.size[1])));
		if (surplusLength <= 0) {
			var totalTime = Math.ceil(parseFloat(vm.costSeconds));
			vm.timeScore = 20 - (totalTime > 25 ? totalTime - 25 : 0);
		}
		vm.totalGameScore = vm.baseScore + vm.curIntegral + vm.timeScore;
		vm.totalIntegral += vm.totalGameScore;
		_gameover();
	}
}