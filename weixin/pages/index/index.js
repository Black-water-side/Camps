Page({
  data: {
    /// 公告栏数据--start
    search_text: '',
    img_src: '/imgs/收藏_index.png',
    text: "测试文字",
    animation: null,
    timer: null,
    duration: 0,
    textWidth: 0,
    wrapWidth: 0,
    /// 公告栏数据--end
    // 数据源
    //0:gid,1:gname,2:gphoto,3,gprice
    goods: [],
    sales: [],
    list: [],
    //收藏页商品 {营Aid:数量,营Bid:数量...}
    shopping_cart: {},
    best: [],
    random: '',
    swiperIdx: 0,
    url: getApp().globalData.server,
  },

  /// 搜索框内容
  //键盘输入时实时调用搜索方法
  input(e) {
    // console.log (e)
    this.search(e.detail.value)
  },
  //点击完成按钮时触发
  confirm(e) {
    this.search(e.detail.value)
  },
  search(key) {
    var that = this;
    //从本地缓存中异步获取指定 key 的内容
    var list = wx.getStorage({
      key: 'list',
      //从Storage中取出存储的数据
      success: function (res) {
        // console.log (res)
        if (key == '') {
          //用户没有输入时全部显示
          that.setData({
            list: res.data
          })
          return;
        }
        var arr = []; //临时数组，用于存放匹配到的数组
        for (let i in res.data) {
          res.data[i].show = false; //所有数据隐藏
          if (res.data[i].search.indexOf(key) >= 0) {
            res.data[i].show = true; //让匹配到的数据显示
            arr.push(res.data[i])
          }
        }
        if (arr.length == 0) {
          that.setData({
            list: [{
              show: true,
              name: '没有相关数据！'
            }]
          })
        } else {
          that.setData({
            list: arr
          })
        }
      },
    })
  },

  /// 内容展现
  onLoad: function (options) {
    this.setData({
      random: Math.random() / 9999
    })
    this.getGoods();
    this.get_sales();
  },
  getGoods: function () { //获取营信息
    console.log("tap");
    wx.request({
      url: getApp().globalData.server + '/goods',
      method: 'POST',
      complete: (res) => {
        //console.log(res);
        this.setData({
          goods: res.data
        })
        //创建选营表
        for (var item of res.data) { //获取热门推荐
          //console.log(item);
          this.setData({
            ['shopping_cart.' + item[0]]: 0,
          })
          wx.request({
            url: getApp().globalData.server + '/get_best_good',
            method: 'POST',
            success: (res1) => {
              var best = []
              if (res1.data.state == 'succeed') {
                for (var index in res1.data.data) {
                  for (var i in res.data) {
                    if (res.data[i][0] == res1.data.data[index][0])
                      best.push(i);
                    //console.log(best);
                  }
                }
                this.setData({
                  best: best
                })
                //console.log(this.data.best)
              }
            }
          })
        }
      },
    })
  },
  get_sales: function () {
    wx.request({
      url: getApp().globalData.server + '/sales',
      success: (res) => {
        this.setData({
          sales: res.data
        });
        console.log(res.data);
        if (res.data == null) this.setData({
          sales: 0
        });
      }
    })
  },

  get_good_info: function (e) {
    var index = parseInt(e.currentTarget.dataset.index);
    wx.navigateTo({ //提交参数到商品明细页：商品id
      url: '/pages/good_info/good_info?good_id=' + this.data.goods[index][0] + '&sales=' + this.data.sales[index]
    })
  },
  bindchange(e) {
    this.setData({
      swiperIdx: e.detail.current
    })
  },
  add_good: function(e) {
    //营添加到收藏页
    var id = parseInt(e.currentTarget.dataset.index);
    var num = 1;
    if (this.data.shopping_cart[id] != undefined) {
      num = this.data.shopping_cart[id] + 1;
    }
    this.setData({
      ['shopping_cart.' + id]: num, //修改收藏页中商品的数量
    });
  },
  minus_good: function (e) { //收藏页删除营
    var id = parseInt(e.currentTarget.dataset.index);
    var num = 0;
    if (this.data.shopping_cart[id] != undefined && this.data.shopping_cart[id] != 0) {
      num = this.data.shopping_cart[id] - 1;
    }
    this.setData({
      ['shopping_cart.' + id]: num, //修改收藏页中商品的数量
    });
    //console.log(this.data.shopping_cart);
  },
  goto_shooping_cart: function () {
    console.log(this.data.goods)
    //console.log(this.data.shopping_cart);
    var selected = 0;
    for (let i in this.data.goods) { //检查是否有选择营
      if (this.data.shopping_cart[this.data.goods[i][0]] != 0) selected = 1;
    }
    if (selected == 1)
      wx.navigateTo({ //字符串化选菜信息，传送到收藏页页面
        url: '/pages/shoppingcart/shoppingcart?shop=' + JSON.stringify(this.data.shopping_cart) +
          "&goods=" + JSON.stringify(this.data.goods),
      })
    else wx.showToast({
      title: '请先选择营',
      icon: 'none'
    })
  },
  onShow: function () {
    this.initAnimation(this.data.text)
  },
  onHide() {
    this.destroyTimer()
    this.setData({
      timer: null
    })
  },
  onUnload() {
    this.destroyTimer()
    this.setData({
      timer: null
    })
  },
destroyTimer() {
    if (this.data.timer) {
      clearTimeout(this.data.timer);
    }
  },
  /**
   * 开启公告字幕滚动动画
   * @param  {String} text 公告内容
   * @return {[type]} 
   */
  initAnimation(text) {
    let that = this
    this.data.duration = 15000
    this.data.animation = wx.createAnimation({
      duration: this.data.duration,
      timingFunction: 'linear'   
    })
    let query = wx.createSelectorQuery()
    query.select('.content-box').boundingClientRect()
    query.select('#text').boundingClientRect()
    query.exec((rect) => {
      that.setData({
        wrapWidth: rect[0].width,
        textWidth: rect[1].width
      }, () => {
        this.startAnimation()
      })
    })
  },
  // 定时器动画
  startAnimation() {
    //reset
    // this.data.animation.option.transition.duration = 0
    const resetAnimation = this.data.animation.translateX(this.data.wrapWidth).step({ duration: 0 })
    this.setData({
      animationData: resetAnimation.export()
    })
    // this.data.animation.option.transition.duration = this.data.duration
    const animationData = this.data.animation.translateX(-this.data.textWidth).step({ duration: this.data.duration })
    setTimeout(() => {
      this.setData({
        animationData: animationData.export()
      })
    }, 100)
    const timer = setTimeout(() => {
      this.startAnimation()
    }, this.data.duration)
    this.setData({
      timer
    })
  },

})
