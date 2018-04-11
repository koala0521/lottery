
var events = require('events');
var eventEmitter = new events.EventEmitter();

window.lottery={
    prize:-1,    //中奖位置
    timer:null,
    init:function(){
        var _this = this;
        
        setTimeout(()=>{       
            this.handMove(99999999999);
        },300);
    },
    // 小手的动画效果
    handMove( time ){        
        let handWrasp = $(".g-hand-wrap");
        handWrasp.addClass("active");
        // 隐藏小手提示
        setTimeout(()=>{
            handWrasp.removeClass("active");
            handWrasp.css({
                left: "80%",
                top:"-30%"
           });
        },time);
    },
    // 牌子恢复默认效果
    defaultCards(){
        let cards = $(".m-flex-item-prize-box");
        cards.each(( index , element) => {
            $(element).removeClass("active");
        });
    },

    // 点击翻牌动画
    clickAndTurnCard( el ){
        console.log( el.offsetLeft , el.offsetTop, el.offsetWidth , el.offsetHeight );

        let handWrasp = $(".g-hand-wrap");

        handWrasp.css({
            
            transition: "ease-in-out 800ms",
            left:( el.offsetLeft + el.offsetWidth / 2 ) + "px",
            top: ( el.offsetTop + el.offsetHeight / 2 ) + "px"
        });
        // 点击效果
        setTimeout(()=>{            
            this.handMove(800);
            // 翻牌
            setTimeout(()=>{
                $(el).addClass("active");
            },800);
        }, 800);
    }
};

var click=false;

window.FlipCard = function(){

    this.limitTimes = null;     //剩余抽奖次数；
    this.resData = null;
    this.netTypeArray = ["undefined", "ethernet", "wifi", "edge", "2g", "3g","4g"];

    this.init();
};
FlipCard.prototype = {
    constructor: FlipCard,
    init: function () {
        this.setDefault(); //进入重置效果
        this.bindEvent();
    },
    bindEvent:function(){
        let _this = this;
        
        $(".m-flex-item-prize-box").on("click", function() {

            if (click) {//click控制一次抽奖过程中不能重复点击抽奖按钮，后面的点击不响应

                return false;
            }else{

                // 没有抽奖次数提示
                if( !_this.limitTimes || _this.limitTimes <= 0 ){

                    _this.showLimited();
                    _this.setLimitAnalysis();

                }else{

                    _this.setClickAnalysis();
                    click=true; //一次抽奖完成后，设置click为true，可继续抽奖
                    _this.getPrize();
                    return false;
                }
            }
        });

        eventEmitter.on('showPriseResult',function(){
            setTimeout(function(){

                let result = _this.resData;
                if(result && result.error_code == 0){
                    _this.showPrize();
                } else {
                    _this.getPrizeFail();
                }

            },500)
        });

        //关闭弹窗
        $('.pop-position').on('touchstart','.close,.close-btn',function(){
            _this.hidePrize();
        });

    },
    // 初始化抽奖页面
    setDefault:function(){
        this.setCache();
        this.getTimes();
        this.iScrollInit();
        lottery.init();
    },
    setClickAnalysis:function(){
        let _this = this;
        if(!window._hmt){
            setTimeout(function(){
                _this.setClickAnalysis();
            },500)
        }else{
            window._hmt.push(['_trackEvent', '幸运翻牌','抽奖', 't9']);
        }
    },
    setLimitAnalysis:function(){
        let _this = this;
        if(!window._hmt){
            setTimeout(function(){
                _this.setLimitAnalysis();
            },500)
        }else{
            window._hmt.push(['_trackEvent', '幸运翻牌-次数已用完','抽奖', 't9']);
        }
    },
    iScrollInit: function iScrollInit() {
        var $item = $('#prize-list').find('.prize-item');
        if ($item.length > 5) {
            window.myScroll = new IScroll('#prize-list', {
                scrollX: true
            });
        }
    },
    // 查询剩余抽奖次数
    getTimes:function(){   
        var _this = this;
        var deviceId = store.get('device_id') || this.getUrlItem('device_id');

        if (deviceId != 'null') {
            var timesData = {
                template_id: window.CFG['template_id'],
                app_id: store.get('app_id') ||this.getUrlItem('app_id'),
                adslot_id: store.get('adslot_id') ||this.getUrlItem('adslot_id'),
                device_id: deviceId,
                timestamp: +new Date(),
            };
            console.log( timesData );           
            $.ajax({
                url: '/url/init',
                type: "post",
                contentType: "application/json;",
                data: JSON.stringify(timesData),
                success: function (result) {
                    if (result.limitTimes >= 0) {
                        _this.limitTimes = result.limitTimes;
                        $('#a-times').text(_this.limitTimes);
                    }
                }
            });
        }
    },
    // 设置缓存
    setCache:function(){    /*设置缓存*/
        for (var key in CFG){
            if (CFG[key] == '' && this.getUrlItem(key) != null) {
                CFG[key] = this.getUrlItem(key);
                store.set(key,CFG[key]);
            }
        }
    },
    // 获取地址栏参数
    getUrlItem:function(name){
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);

        console.log(r);
        
        if (r != null) return unescape(r[2]); return null;
    },
    // 抽中红包，获取奖项  > 请求广告
    getPrize:function(){   
        var _this = this;

        this.resData = {};

        var ajaxTimeoutTest = $.ajax({
            url: '/url/advert',
            type: "post",
            contentType: "application/json;",
            data: JSON.stringify(_this.collReqData()),
            timeout: 3000,
            complete : function(XMLHttpRequest,status){ //请求完成后最终执行参数
                if(status=='timeout'){//超时,status还有success,error等值的情况
                    ajaxTimeoutTest.abort();
                    _this.getPrizeFail();
                    click = false;
                }
                _this.resData = XMLHttpRequest.responseJSON||{};
                // 请求成功
                if (_this.resData.error_code == 0) {
                    _this.limitTimes = _this.resData.limitTimes;
                    // 更新数据
                    $('#a-times').text( _this.limitTimes );                    
                    // 抽奖动作
                    lottery.clickAndTurnCard( this );
                }
            },
            success: function (result) {
                console.log("请求成功");
            },
            error: function(err){
                console.log("请求失败");   
                click = false;             
                _this.showNetError();
            }
        });
    },
    // 查询奖品失败
    getPrizeFail:function(){
        if (this.resData['error_code'] && this.resData['limitTimes'] > 0 ){
            this.limitTimes = this.resData['limitTimes'];
        }
        this.showNoResult();
    },
    // 展示抽中奖品
    showPrize:function(){
        var _this = this;
        var $popPosition = $('.pop-position ');

        var $countZa = $('#a-times');
        this.limitTimes = this.resData&&this.resData.limitTimes;
        $countZa.text(this.limitTimes||0);


        //请求成功，发送检波
        if (_this.resData['adms']) {
            var adMsg = _this.resData['adms'][0];

            $popPosition.find('.prizes-img').attr('src',adMsg.imgurls);
            $popPosition.find('.prizes-name').text(adMsg.title);

            _this.showLog(adMsg['imptrackers']);


            $('.prizes-zoom-box,#hdgg_click_ad_btn')
                .unbind( "click" )
                .on('click',function () {
                    _this.clickLog(adMsg['clktrackers']);

                    setTimeout(function () {
                        window.location.href = adMsg['clkurl']; //跳转页面
                    },600);
                });
        }
        $popPosition.find('.prizes-no-cont').hide();
        $popPosition.find('.prizes-cont-box').removeClass('hdgg_result_hide_animation').addClass('hdgg_result_show_animation').show();
        $popPosition.show();

    },
    // 没有抽中提示
    showNoResult:function(){
        var $popPosition = $('.pop-position ');
        $popPosition.find('.prizes-no-cont').show();
        $popPosition.find('.prizes-cont-box').hide();
        $('.prizes-no-cont .prizes-no-img').attr('src','./dist/img/flipCard/prizes-pop-fail.png');
        $popPosition.show();
    },
    // 抽奖次数用完提示
    showLimited:function(){
        var $popPosition = $('.pop-position ');
        $popPosition.find('.prizes-no-cont').show();
        $popPosition.find('.prizes-cont-box').hide();
        $('.prizes-no-cont .prizes-no-img').attr('src','./dist/img/flipCard/prizes-pop-no.png');
        $popPosition.show();
    },
    // 网络错误提示
    showNetError:function(){
        var $popPosition = $('.pop-position ');
        $popPosition.find('.prizes-no-cont').show();
        $popPosition.find('.prizes-cont-box').hide();
        $('.prizes-no-cont .prizes-no-img').attr('src','./dist/img/flipCard/prizes-pop-error.png');
        $popPosition.show();
    },
    // 关闭弹框
    hidePrize:function(){
        var $popPosition = $('.pop-position ');
        $popPosition.find('.prizes-no-cont').hide();
        $popPosition.find('.prizes-cont-box').removeClass('hdgg_result_show_animation').addClass('hdgg_result_hide_animation');
        $popPosition.fadeOut();
        // lottery.autoPlay();
        lottery.prize=-1;
        lottery.times=0;
        click=false;
        lottery.defaultCards();
    },
    showLog:function(urlArray){
        if (urlArray.length < 1 ) return;
        for(var i=0;i<urlArray.length;i++){
            $('#contaner').append('<img class="imptrace" src="'+ urlArray[i] +'" />');
        }
    },
    clickLog:function(urlArray){
        if (urlArray.length < 1 ) return;
        for(var j=0;j<urlArray.length;j++){
            $('#contaner').append('<img class="clicktrace" src="'+ urlArray[j] +'" />');
        }
    },
    /*获取设备网络环境*/
    getNetwork:function(){    
        var t = null,
            netType = 0
            , e = window.navigator.userAgent
            , n = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        if (/MicroMessenger/.test(e))
            if (/NetType/.test(e)) {
                var i = e.match(/NetType\/(\S*)/);
                t = i[1];
            } else
                document.addEventListener("WeixinJSBridgeReady", function() {
                    WeixinJSBridge.invoke("getNetworkType", {}, function(e) {
                        t = e.err_msg
                    });
                });
        else if (n) {
            var o = n.type;
            t = o;
        }
        var r = this.netTypeArray;
        if (typeof(t) != 'string') t = 'undefined';
        t = t.toLowerCase();
        for (var k=0;k<r.length;k++){
            if(t.indexOf(r[k]) > -1) {
                netType = k;
                break;
            }
        }
        return netType;
    },
    // 请求参数
    collReqData:function(){
        var reqData = {
            template_id: window.CFG['template_id'],
            device_id:  store.get('device_id') || this.getUrlItem('device_id'),
            app_id: store.get('app_id') ||this.getUrlItem('app_id'),
            adslot_id: store.get('adslot_id') ||this.getUrlItem('adslot_id'),
            connect_type: this.getNetwork(),
            width:  $(window).width(),
            height: $(window).height(),
            timestamp: +new Date(),
        };
        return reqData;
    }
};

new FlipCard();









