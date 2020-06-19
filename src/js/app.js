
App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  loading: false,
  isAdmin: false,

  isNewUser: true,
  ///transaction tables
  totalRecords : 0,
  transaction_records : [],
  recPerPage : 10,
  page : 1,
  totalPages : 0,
  apply_pagination:function() {
    $('#pagination').twbsPagination({
      totalPages: App.totalPages,
      visiblePages: 6,
      onPageClick: function (event, page) {
        console.log(page);
        App.refreshPage();

      }
    });
  },
  refreshPage: function(){
    displayRecordsIndex = Math.max(App.page - 1, 0) * App.recPerPage;
    endRec = (displayRecordsIndex) + App.recPerPage;
    if(endRec >= App.totalRecords ) endRec = App.totalRecords - 1 ;

    App.getTransaction(displayRecordsIndex, endRec).then(function(result){
      var ids = result[0];
      var addrs = result[1];
      var amounts = result[2];
      var updates = result[3];
      App.transaction_records = [];
      var id, addr, amount, updateat;
      for(var i = 0; i < ids.length; i++){
        id = ids[i];
        addr = addrs[i];
        amount = web3.utils.fromWei(amounts[i],'mwei');
        amount = amount / 100 ;
        updateat = new Date(updates[i] * 1000);
        // updateat = updates[i];
        App.transaction_records[i] = {"id":id,"address":addr,"amount":amount,"updated_at":updateat};
      }
      App.generate_table();
    }).catch(function(){
      App.transaction_records = [];
      App.generate_table();
    });
  },

  generate_table: function() {
    var tr;
    $('#emp_body').html('');
    for (var i = 0; i < App.transaction_records.length; i++) {
      tr = $('<tr/>');
      tr.append("<td>" + App.transaction_records[i].id + "</td>");
      tr.append("<td>" + App.transaction_records[i].address + "</td>");
      tr.append("<td>" + App.transaction_records[i].amount + "</td>");
      tr.append("<td>" + App.transaction_records[i].updated_at + "</td>");
      $('#emp_body').append(tr);
    }
  },
  initPaginate: function(){
    App.getTotalUsers().then(function(result){
      App.totalRecords = result;
      App.totalPages = Math.ceil(App.totalRecords / App.recPerPage);
      App.apply_pagination();
    }).catch(function(){});
  },
  getTransaction: function(stIndex, edIndex){return new Promise((resolve,reject) => {
    console.log('Getting All transactions...');
    App.contracts.SwapContract.methods.getTransaction(stIndex,edIndex).call().then(function(result){
          resolve(result);
    }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    }
  );},

  getEntityByAddress: function(addr){return new Promise((resolve,reject) => {
    console.log('Getting transactions by address...');
    App.contracts.SwapContract.methods.getEntityByAddress(addr).call().then(function(result){
      resolve(result);
    }).catch(function(err) {
      console.log(err.message);
      reject();
    });
  });},
  
  getEntity: function(index){return new Promise((resolve,reject) => {
    console.log('Getting transactions by index ...');
    App.contracts.SwapContract.methods.getEntity(index).call().then(function(result){
      resolve(result);
    }).catch(function(err) {
      console.log(err.message);
      reject();
    });
    
  });},

  handleSearchTransaction: function(e){
    var search_text = $('#search_transaction').val();
    if(search_text.trim() =="")
    {
        App.refreshPage();
    }
    else{
      App.getEntityByAddress(search_text).then(function(result){
        App.transaction_records = [];
        var id, addr, amount, updateat;
        
        id = result[0];
        addr = result[1];
        amount = web3.utils.fromWei(result[2],'mwei');
        amount = amount / 100 ;
        updateat = new Date(result[3] * 1000);
        // updateat = updates[i];
        App.transaction_records[0] = {"id":id,"address":addr,"amount":amount,"updated_at":updateat};
        App.generate_table();

      }).catch(function(){
        App.transaction_records = [];
        App.generate_table();
      });
    }
  },

////////////////////////////////////////

  init: function() {
    return App.initWeb3();
  },

  async initWeb3() {
    // Initialize web3 and set the provider to the testRPC.
    // Modern dapp browsers...
    if(window.ethereum){
      App.web3Provider = window.ethereum; 
      window.web3 = new Web3(window.ethereum);
        try {
          // Request account access if needed
          // await ethereum.enable();
          await window.ethereum.enable();

          // Acccounts now exposed
          // web3.eth.sendTransaction({/* ... */});
      } catch (error) {
          // User denied account access...
          console.error("Unable to retrieve your accounts! You have to approve this application on Metamask.");
      }
    }
    // Legacy dapp browsers...
    else if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider || "ws://localhost:8545");
      // Acccounts always exposed
      // web3.eth.sendTransaction({/* ... */});
    } else {
      // set the provider you want from Web3.providers
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
      web3 = new Web3(App.web3Provider);
    }

    return App.initContract();
  },

  async initContract() {
    const networkId = await web3.eth.net.getId();
    $.getJSON('UMCToken.json', function(artifact) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      const deployedAddress = artifact.networks[networkId].address;
      App.contracts.UMCToken = new web3.eth.Contract(artifact.abi, deployedAddress);


      // Use our contract to retieve and mark the adopted pets.
      App.balanceOf().then(function(balance){
        $(".myUMCBalance").text(balance);
      });
    });
    $.getJSON('EBTC.json', function(artifact) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      const deployedAddress = artifact.networks[networkId].address;
      App.contracts.EBTCToken = new web3.eth.Contract(artifact.abi, deployedAddress);

    });

    $.getJSON('SwapContract.json', function(artifact) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      const deployedAddress = artifact.networks[networkId].address;
      App.contracts.SwapContract = new web3.eth.Contract(artifact.abi, deployedAddress);
      // Use our contract to retieve and mark the adopted pets.
      App.getEBTCBalance().then((result)=>{
        $('#eBitcoinBalance').text(result);
      }).catch((err)=>{
        console.log(err.message);
      });

      App.chechAddressIsOwnerOfSwapContract().then(function(result)
      {
        App.getMinimumDepositAmount();
        App.getMaximumDepositAmount();
        App.getSwapEnable();
        // Use our contract to retieve and mark the adopted pets.
        App.isAdmin = result;
        if(App.isAdmin){
          $('.admin-pannel').addClass("show");
          $('.admin-pannel').removeClass("hidden");


          $('#user-pannel').addClass("hidden");
          $('#user-pannel').removeClass("show");

          App.getTotalDepositedToken();
          App.getTotalSwappedToken();
          App.getTotalUsers().then(function(result){
            $('#TotalUsers').text(result);
          }).catch(function(){});

          App.totalSupply().then(function(result){
            $("#TotalSupply").text(result);
          });
          App.initPaginate();

        }
        else{      //user side information

          $('.admin-pannel').addClass("hidden");
          $('.admin-pannel').removeClass("show");
          
          $('#user-pannel').addClass("show");
          $('#user-pannel').removeClass("hidden");


          App.getUMCBalance();
          App.isEntity().then((result)=>{
            App.isNewUser = !result;
            if(!App.isNewUser){
              App.getDepoistedAmount().then(function(result){
                $('#myEBTCDepositedAmount').text(result);
              });
            }
            else{
              $('#myEBTCDepositedAmount').text("---");
            }
          })
        }
      });
    });
    $.getJSON('ChequeOperator.json', function(artifact) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      const deployedAddress = artifact.networks[networkId].address;
      App.contracts.ChequeOperator = new web3.eth.Contract(artifact.abi, deployedAddress);

    });
    return App.bindEvents();

  },
  
  bindEvents: function() {
    // $(document).on('click', '#transferButton', App.handleTransfer);
    // // //admin side
    $(document).on('click', '#ParamSetting', App.handleSetAdminParams);
    $(document).on('change','#search_transaction',App.handleSearchTransaction);
    // $(document).on('click', '#sendRewardsButton', App.handleDivideRewards);
    
    // // //user side
    $(document).on('click', '#submitDeposit', App.handleSubmitDeposit);
    $(document).on('change', '#DepositAmount', App.handleDepositAmountChange);
    $(document).on('click', '#testCheque', App.testCheque);
    $(document).on('click',"#submitTransaction",App.submitTransaction);
    // $(document).on('click', '#submitWithdraw', App.handleSubmitWithdraw);

    // var account = web3.eth.accounts[0];
    // var accountInterval = setInterval(function() {
    //   if (web3.eth.accounts[0] !== account) {
    //     account = web3.eth.accounts[0];
    //     refreshPage();
    //   }
    // }, 100);
    window.ethereum.on('accountsChanged', function (accounts) {
      // Time to reload your interface with accounts[0]!
      refreshPage();
    });
    window.ethereum.on('networkChanged', function (networkId) {
      // Time to reload your interface with accounts[0]!
      refreshPage();
    });
    
    
  },
  testCheque: async function(e) {
    e.preventDefault();
      // Use our contract to retieve and mark the adopted pets.
    try {
      const accounts = await web3.eth.getAccounts();
        var account = accounts[0];

        var _token = App.contracts.UMCToken.options.address;
        var _holder = account;
        var _to = "0xb7B1Ca08408aE8ed920C9dCFC9A02469532C0506";
        var _data = web3.utils.utf8ToHex("test");
        var _amount = 100000000;
        var _nonce = 1 ;
        var hexData = [
          '0x',
          _token.slice(2),
          _holder.slice(2),
          _to.slice(2),
          leftPad((_amount).toString(16), 64, 0),
          _data.slice(2),
          leftPad(_nonce.toString(16),64,0)      
        ].join('');

         var msg = web3.utils.sha3(hexData, { encoding: 'hex' });

        //msg = "\x19Ethereum Signed Message:\n32" + msg;
        web3.eth.personal.sign(msg, account,'').then(function(result){
          console.log(result);
        }).catch(function(err){
          console.log(err.message);
        });


    } catch(err) {
      console.log(err.message);
    }
  },
  submitTransaction: async function(e){
    try{
      var _token = App.contracts.UMCToken.options.address;
      var _holder = "0xCb6CC6694866BFEbFEd8Ac6cbca03a9403c5f6fa";
      var _to = "0xb7B1Ca08408aE8ed920C9dCFC9A02469532C0506";
      var _amount = 100000000;
      var _data = web3.utils.utf8ToHex("test");
      var _nonce = 1 ;
      var _sig = "0x19ac74e0de4b22666f4599263682f5427243a8aa6f7a5ae7312873cce5d648967d426dd37b1033ffc14569c509072816f5550ba5b7a670af7dcc5f7017362ef71c";
      
      App.contracts.ChequeOperator.methods
      .getHash1(_token, _holder, _to, _amount, _data, _nonce)
      .call().then(function(hash1){
        console.log("hash1 ......");
        console.log(hash1);
        App.contracts.ChequeOperator.methods.getHash2(hash1).call().then(function(hash2){
          console.log("hash2....");
          console.log(hash2);
          App.contracts.ChequeOperator.methods.getSignerFromHash(hash2,_sig).call().then(function(result){
            console.log("signer ....");
            console.log(result);
          });
        }).catch(console.log);

      }).catch(console.log);
      
      return;
      App.contracts.ChequeOperator.methods
      .getSigner(_token, _holder, _to, _amount, _data, _nonce, _sig)
      .call().then(console.log).catch(console.log);
      return;
      await App.contracts.ChequeOperator.methods
      .sendByCheque(_token, _to, _amount, _data, _nonce, _sig)
      .send({
        from: accounts[0],
        gas: 500000
      }).on("transactionHash",function(hash){
        console.log(hash);
      });
    } catch(err) {
      console.log(err.message);
    }
  },
  //shared api and event handler
  handleSetAdminParams: async function(event){
    event.preventDefault();
    startLoading("Setting admin params...");
    var MinimumDepositAmount = parseFloat($('#MinimumDepositAmount').val());
    var MaximumDepositAmount = parseFloat($('#MaximumDepositAmount').val());
    var SwapEnable = $('#AdminSwapEnable').prop('checked')
    await App.setAdminParams(MinimumDepositAmount, MaximumDepositAmount, SwapEnable);

  },
  handleSubmitDeposit: async function(event){
    event.preventDefault();

    var DepositAmount = parseFloat($('#DepositAmount').val());
    var MinimumDepositAmount = parseFloat($('#MinimumDepositAmount').val());
    var MaximumDepositAmount = parseFloat($('#MaximumDepositAmount').val());
    if(DepositAmount < MinimumDepositAmount)
    {
      alert("Deposit Amount is smaller than Minimum Deposit Amount");
      return;
    }
    if(DepositAmount > MaximumDepositAmount)
    {
      alert("Deposit Amount is greater than Minimum Deposit Amount");
      return;
    }
    startLoading("Swapping is progress...");
    var _to = App.contracts.SwapContract.options.address;
    DepositAmount = DepositAmount * 100;
    App.checkApprove(_to,web3.utils.toWei(DepositAmount.toString(),'mwei'), function(result){
      if(result){
        App.placeDeposit(web3.utils.toWei(DepositAmount.toString(),'mwei'), function(result2){
          if(result2){
            alert("Swapping is Successfull");
            refreshPage();
          } else {
            stopLoading();
            alert("Swapping  is Fialed");
            // console.log(err.message);
          }
        });
      } else {
        stopLoading();
        alert("Swapping  is Fialed");
        // console.log(err.message);
      }
    });

  },
  handleDepositAmountChange: function(){
    var DepositAmount = parseFloat($('#DepositAmount').val());
    App.getEBTCBalance().then(function(result){
      if(DepositAmount > result){
        alert("Deposit amount is greater than eBTC balance");
        $('#DepositAmount').val(result);
        $('#DepositAmount').focus();
        DepositAmount = result;
      }
      var ReceiveAmount = DepositAmount * 2.0 ;
      $("#ReceiveAmount").val(ReceiveAmount);
    }).catch(function(){});
  },

  chechAddressIsOwnerOfSwapContract: function(){ return new Promise((resolve,reject) => {
    console.log('Checking Address and decide admin or user ...');
      web3.eth.getAccounts().then(function(accounts){
        var account = accounts[0];
        App.contracts.SwapContract.methods.owner().call().then(function(result){
          resolve(result==account);
        }).catch(function(err){
          console.log(err.message);
          reject();
        });
      }).catch(function(err){
        console.log(err.message);
        reject();
      });
    }).catch(function(err) {
      console.log(err.message);
      reject();
    });
  },
  //admin api ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////   admin side  //////////////////////
  totalSupply: function(){ return new Promise((resolve,reject) => {
    App.contracts.UMCToken.methods.totalSupply().call().then(function(result){
      returned_value = web3.utils.fromWei(result);
      resolve(returned_value);
    }).catch(function(err) {
      console.log(err.message);
      reject();
    });
    });
  },

  balanceOf: function() { return new Promise((resolve, reject) => {
    console.log('Getting balances...');
    web3.eth.getAccounts().then(function(accounts){
      var account = accounts[0];
      App.contracts.UMCToken.methods.balanceOf(account).call().then(function(result){
        returned_value = web3.utils.fromWei(result);
        resolve(returned_value);
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    });
       
    });
  },
  
  getTotalDepositedToken: function(){
    console.log('Getting Total Deposited Tokens...');
    App.contracts.SwapContract.methods.getTotalDepositedToken().call().then(function(result){
      returned_value = web3.utils.fromWei(result,'mwei');
      returned_value = returned_value / 100 ;
      $('#TotalDepsitedEBTC').text(returned_value);
    }).catch(function(err){
      console.log(err.message);
    });
  },

  getTotalSwappedToken: function(){
    console.log('Getting Total Swapped Tokens...');
    App.contracts.SwapContract.methods.getTotalSwappedToken().call().then(function(result){
      returned_value = web3.utils.fromWei(result);
      $('#TotalSwappedUMC').text(returned_value);
    }).catch(function(err){
      console.log(err.message);
    });
  },

  getTotalUsers: function(){return new Promise((resolve,reject) => {
    console.log('Getting Activated Users...');
    App.contracts.SwapContract.methods.getEntityCount().call().then(function(result){
      returned_value = result;
      resolve(returned_value);
    }).catch(function(err){
      console.log(err.message);
      reject();
    });
  });},

  getSwapEnable: function(){
    console.log('Getting Swapping status...');
    App.contracts.SwapContract.methods.getSwapEnable().call().then(function(result){
      returned_value = result;
      $('#AdminSwapEnable').prop("checked",returned_value);
      
      if(returned_value){
        $('#SwapEnable').text("Enabled");
        $("#submitDeposit").removeClass("disabled");
        $("#submitDeposit").attr("disabled",false);
        $("#DepositAmount").removeClass("disabled");
        $("#DepositAmount").attr("disabled",false);
      }
      else{
        $('#SwapEnable').text("Disabled");
        $("#submitDeposit").addClass("disabled");
        $("#submitDeposit").attr("disabled",true);
        $("#DepositAmount").addClass("disabled");
        $("#DepositAmount").attr("disabled",true);
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },
  getMinimumDepositAmount: function(){
    console.log('Getting Minimum Deposit Amount...');
    App.contracts.SwapContract.methods.getMinimumDepositAmount().call().then(function(result){
      returned_value = web3.utils.fromWei(result,'mwei');
      returned_value = returned_value / 100 ;
      $('#MinimumDepositAmount').val(returned_value);
      $('#userMinimumDepositAmount').text(returned_value);
    }).catch(function(err) {
      console.log(err.message);
    });
  },
  getMaximumDepositAmount: function(){
    console.log('Getting Maximum Deposit Amount...');
    App.contracts.SwapContract.methods.getMaximumDepositAmount().call().then(function(result){
      returned_value = web3.utils.fromWei(result,'mwei');
      returned_value = returned_value / 100 ;
      $('#MaximumDepositAmount').val(returned_value);
      $('#userMaximumDepositAmount').text(returned_value);
    }).catch(function(err) {
      console.log(err.message);
    });
  },
  setAdminParams: async function(minimumDepositAmount,maximumDepositAmount,swapEnable) {
    console.log('Set Admin Params to minimumDepositAmount  ' +  minimumDepositAmount + 'eBTC' +
                                  '  maximumDepositAmount  ' +  maximumDepositAmount + 'eBTC' +
                                  '  swapEnable  ' +  swapEnable + '  ...');
      minimumDepositAmount = minimumDepositAmount*100;
      maximumDepositAmount = maximumDepositAmount*100;
      
      var minValue = web3.utils.toWei(minimumDepositAmount.toString(),'mwei');
      var maxValue = web3.utils.toWei(maximumDepositAmount.toString(),'mwei');
      try{
        const accounts = await web3.eth.getAccounts();
        await App.contracts.SwapContract.methods
          .setAdminParams(minValue,maxValue,swapEnable)
          .send({
            from: accounts[0],
            gas: 500000
          }).on("transactionHash", function(hash) {
          
            console.log("Transaction hash: " + hash);
            App.getMinimumDepositAmount();
            App.getMaximumDepositAmount();
            App.getSwapEnable();
            stopLoading();
            alert("Operation is successed!");
          });

      } catch(err) {
        console.log(err.message);
        stopLoading();
        alert("Operation is failed!");
      }
  },
  
///// User part ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  user side   /////////////////////////////

  getEBTCBalance: function(){return new Promise((resolve,reject) => {
    console.log('Getting eBitcoin balance...');
    web3.eth.getAccounts().then(function(accounts){
      var account = accounts[0];
      App.contracts.SwapContract.methods.getEBTCBalance(account).call().then(function(result){
        returned_value = web3.utils.fromWei(result,'mwei');
        returned_value = returned_value / 100;
        resolve(returned_value);
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    });
  });},

  getUMCBalance: function(){
    console.log('Getting UMC balance...');
    web3.eth.getAccounts().then(function(accounts){
      var account = accounts[0];
      App.contracts.SwapContract.methods.getUMCBalance(account).call().then(function(result){
        returned_value = web3.utils.fromWei(result)
        $('.UMCBalance').text(returned_value);
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  isEntity: function(){ return new Promise((resolve,reject) => {
    web3.eth.getAccounts().then(function(accounts){
      var account = accounts[0];
      App.contracts.SwapContract.methods.isEntity(account).call().then(function(result){
        returned_value = result;
        resolve(returned_value);
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    }).catch(function(err) {
      console.log(err.message);
      reject();
    });
  });},

  getDepoistedAmount: function(){ return new Promise((resolve,reject) => {
    web3.eth.getAccounts().then(function(accounts){
      var account = accounts[0];
      App.contracts.SwapContract.methods.getEntityByAddress(account).call().then(function(result){
        var id, addr, amount, updateat;
        id = result[0];
        addr = result[1];
        amount = web3.utils.fromWei(result[2],'mwei');
        amount = amount / 100 ;
        updateat = new Date(result[3]* 1000);
        resolve(amount);
      }).catch(function(err) {
      console.log(err.message);
      reject();
      });
    }).catch(function(err) {
      console.log(err.message);
      reject();
    });

  });},

  checkApprove:async function(to,amount, cb) { 
    console.log('Checking approve address ' + to + 'amount ' + amount +'...');
    try{
      const accounts = await web3.eth.getAccounts();
      await App.contracts.EBTCToken.methods.approve(to,amount)
      .send({
        from: accounts[0],
        gas: 500000
      }).on("transactionHash", function(hash) {
        cb(true);
      });
    } catch(err) {
      console.log(err.message);
      cb(false);
    }
  },

  placeDeposit:async function(amount,cb){ 
    console.log('place Depsoit  ' + amount + ' eBTC ' + '...');
    try{
      const accounts = await web3.eth.getAccounts();
      await App.contracts.SwapContract.methods.placeDeposit(amount)
      .send({
        from: accounts[0],
        gas: 500000
      }).on("transactionHash", function(hash){
        cb(true);
      });
      
    } catch(err){
      console.log(err.message);
      cb(false);
    }
  }, 
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
////////////////////////////////////////////////////////////////////////       general functions   ////////////////////////////////////////////////////



function refreshPage(){
  window.location.reload(true);
}
function startLoading(status_string){
  $.loadingBlockShow({
    imgPath: 'default.svg',
    text: status_string,
    style: {
        position: 'fixed',
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, .8)',
        left: 0,
        top: 0,
        zIndex: 10000
    }
  });
}
function stopLoading(){
  $.loadingBlockHide();
}
function leftPad (str, len, ch) {
  str = String(str);

  var i = -1;

  if (!ch && ch !== 0) ch = ' ';

  len = len - str.length;

  while (++i < len) {
    str = ch + str;
  }

  return str;
}