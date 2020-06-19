App = {
  web3Provider: null,
  contracts: {},
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
        id = ids[i].c[0];
        addr = addrs[i];
        amount = WEI2EBTC(amounts[i]);
        updateat = new Date(updates[i].c[0] * 1000);
        // updateat = updates[i].c[0];
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
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
  
        var account = accounts[0];
  
        App.contracts.SwapContract.deployed().then(function(instance) {
            return instance.getTransaction(stIndex,edIndex);
        }).then(function(result) {
          resolve(result);
        }).catch(function(err) {
          console.log(err.message);
          reject();
        });
      });
  });},

  getEntityByAddress: function(addr){return new Promise((resolve,reject) => {
    console.log('Getting transactions by address...');
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SwapContract.deployed().then(function(instance) {
          return instance.getEntityByAddress(addr);
      }).then(function(result) {
        resolve(result);
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    });
  });},
  
  getEntity: function(index){return new Promise((resolve,reject) => {
    console.log('Getting transactions by index ...');
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SwapContract.deployed().then(function(instance) {
          return instance.getEntity(index);
      }).then(function(result) {
        resolve(result);
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
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
        
        id = result[0].c[0];
        addr = result[1];
        amount = WEI2EBTC(result[2]);
        updateat = new Date(result[3].c[0] * 1000);
        // updateat = updates[i].c[0];
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

  initWeb3: function() {
    // Initialize web3 and set the provider to the testRPC.
    // Modern dapp browsers...
    if(window.ethereum){
      App.web3Provider = window.ethereum; 
      window.web3 = new Web3(window.ethereum);
        try {
          // Request account access if needed
          // await ethereum.enable();
          window.ethereum.enable();

          // Acccounts now exposed
          // web3.eth.sendTransaction({/* ... */});
      } catch (error) {
          // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
      // Acccounts always exposed
      // web3.eth.sendTransaction({/* ... */});
    } else {
      // set the provider you want from Web3.providers
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
      web3 = new Web3(App.web3Provider);
    }

    return App.initContract();
  },

  initContract: function() {

    $.getJSON('UMCToken.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      var UMCTokenArtifact = data;
      App.contracts.UMCToken = TruffleContract(UMCTokenArtifact);

      // Set the provider for our contract.
      App.contracts.UMCToken.setProvider(App.web3Provider);

      // Use our contract to retieve and mark the adopted pets.
      App.balanceOf().then(function(balance){
        $(".myUMCBalance").text(balance);
      });
    });
    $.getJSON('EBTC.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      var EBTCTokenArtifact = data;
      App.contracts.EBTCToken = TruffleContract(EBTCTokenArtifact);

      // Set the provider for our contract.
      App.contracts.EBTCToken.setProvider(App.web3Provider);


    });

    $.getJSON('SwapContract.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      var SwapContractArtifact = data;
      App.contracts.SwapContract = TruffleContract(SwapContractArtifact);

      // Set the provider for our contract.
      App.contracts.SwapContract.setProvider(App.web3Provider);
      // Use our contract to retieve and mark the adopted pets.
      App.getEBTCBalance().then((result)=>{
        $('#eBitcoinBalance').text(result);
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
    $.getJSON('ChequeOperator.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract.
      var ChequeOperatorArtifact = data;
      App.contracts.ChequeOperator = TruffleContract(ChequeOperatorArtifact);

      // Set the provider for our contract.
      App.contracts.ChequeOperator.setProvider(App.web3Provider);

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
    
  },
  testCheque: function(e) {
    e.preventDefault();
      // Use our contract to retieve and mark the adopted pets.
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
 
        var account = accounts[0];

        var _token = App.contracts.UMCToken.address;
        var _to = "0xb7B1Ca08408aE8ed920C9dCFC9A02469532C0506";
        var _data = "test";
        var _amount = 0.1;
        var _nonce = 1 ;
        const hexData = [
          _token.slice(2),
          _to.slice(2),
          leftPad((_amount).toString(16), 64, 0),
          _data,
          _nonce      
        ].join('');

        const msg = web3.sha3(hexData, { encoding: 'hex' }).slice(2);

        const signature = web3.eth.personal.sign(msg, account).then(function(result){
          alert(result);
        });
        console.log(signature);

      //   web3.eth.sign(account, msg, function(error, signature) {
      //     if (!error) {
      //         console.log(account);
      //         console.log(signature);
      //     } else {
      //         console.log(error);
      //     }
      // });
    });
  },
  //shared api and event handler
  handleSetAdminParams:function(event){
    event.preventDefault();
    startLoading("Setting admin params...");
    var MinimumDepositAmount = parseFloat($('#MinimumDepositAmount').val());
    var MaximumDepositAmount = parseFloat($('#MaximumDepositAmount').val());
    var SwapEnable = $('#AdminSwapEnable').prop('checked')
    App.setAdminParams(MinimumDepositAmount, MaximumDepositAmount, SwapEnable);

  },
  handleSubmitDeposit:function(event){
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
    var _to = App.contracts.SwapContract.address;
    App.checkApprove(_to,EBTC2WEI(DepositAmount)).then(function(result){
      if(result){
        App.placeDeposit(EBTC2WEI(DepositAmount)).then(function(result2){
          if(result2){
            alert("Swapping is Successfull");
          }
          else{
            alert("Swapping  is Fialed");
          }
          refreshPage();

        }).catch(function(err){
          stopLoading();
          alert("Swapping  is Fialed");
          console.log(err.message);
        });
      }
    }).catch(function(err){
      stopLoading();
      alert("Swapping  is Fialed");
      console.log(err.message);
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
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SwapContract.deployed().then(function(instance) {

        return instance.owner();
      }).then(function(result) {
        ownerAddress = result;
        resolve(ownerAddress == account);
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    });
  });},
  //admin api ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////   admin side  //////////////////////
  totalSupply: function(){ return new Promise((resolve,reject) => {

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      console.log('Getting Referral Address of ' + account + '  .....');
      App.contracts.UMCToken.deployed().then(function(instance) {

        return instance.totalSupply();
      }).then(function(result) {
        returned_value = WEI2HAC(result);
        resolve(returned_value);
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    });
  });},

  balanceOf: function() { return new Promise((resolve, reject) => {
    console.log('Getting balances...');

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.UMCToken.deployed().then(function(instance) {
        return instance.balanceOf(account);
      }).then(function(result) {
        // balance = result.c[0];
        balance = WEI2HAC(result);
        resolve(balance);
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    });
  });},
  
  getTotalDepositedToken: function(){
    console.log('Getting Total Deposited Tokens...');

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SwapContract.deployed().then(function(instance) {
        return instance.getTotalDepositedToken();
      }).then(function(result) {
        returned_value = WEI2EBTC(result);
        $('#TotalDepsitedEBTC').text(returned_value);
        
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  getTotalSwappedToken: function(){
    console.log('Getting Total Swapped Tokens...');

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SwapContract.deployed().then(function(instance) {
        return instance.getTotalSwappedToken();
      }).then(function(result) {
        returned_value = WEI2HAC(result);
        $('#TotalSwappedUMC').text(returned_value);
        
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  getTotalUsers: function(){return new Promise((resolve,reject) => {
    console.log('Getting Activated Users...');

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SwapContract.deployed().then(function(instance) {

        return instance.getEntityCount();
      }).then(function(result) {
        returned_value = result.c[0];
        resolve(returned_value);
        
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    });
  });},

  getSwapEnable: function(){
    console.log('Getting Swapping status...');

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SwapContract.deployed().then(function(instance) {
        return instance.getSwapEnable();
      }).then(function(result) {
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
    });
  },
  getMinimumDepositAmount: function(){
    console.log('Getting Minimum Deposit Amount...');

    var contractInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SwapContract.deployed().then(function(instance) {
        contractInstance = instance;

        return contractInstance.getMinimumDepositAmount();
      }).then(function(result) {
        returned_value = WEI2EBTC(result);
        $('#MinimumDepositAmount').val(returned_value);
        $('#userMinimumDepositAmount').text(returned_value);
        
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },
  getMaximumDepositAmount: function(){
    console.log('Getting Maximum Deposit Amount...');

    var contractInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.SwapContract.deployed().then(function(instance) {
        contractInstance = instance;

        return contractInstance.getMaximumDepositAmount();
      }).then(function(result) {
        returned_value = WEI2EBTC(result);
        $('#MaximumDepositAmount').val(returned_value);
        $('#userMaximumDepositAmount').text(returned_value);
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },
  setAdminParams: function(minimumDepositAmount,maximumDepositAmount,swapEnable) {
    console.log('Set Admin Params to minimumDepositAmount  ' +  minimumDepositAmount + 'eBTC' +
                                  '  maximumDepositAmount  ' +  maximumDepositAmount + 'eBTC' +
                                  '  swapEnable  ' +  swapEnable + '  ...');

    var contractInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.SwapContract.deployed().then(function(instance) {
        contractInstance = instance;
        minimumDepositAmount = web3.utils.toWei(minimumDepositAmount,'100000000');
        maximumDepositAmount = EBTC2WEI(maximumDepositAmount);
        return contractInstance.setAdminParams(minimumDepositAmount,maximumDepositAmount,swapEnable);
      }).then(function(result) {
        App.getMinimumDepositAmount();
        App.getMaximumDepositAmount();
        App.getSwapEnable();
        stopLoading();
        alert("Operation is successed!");
      }).catch(function(err) {
        console.log(err.message);
        stopLoading();
        alert("Operation is failed!");
      });
    });
  },
  
///// User part ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  user side   /////////////////////////////

  getEBTCBalance: function(){return new Promise((resolve,reject) => {
    console.log('Getting eBitcoin balance...');
  
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
  
      var account = accounts[0];
  
      App.contracts.SwapContract.deployed().then(function(instance) {
        return instance.getEBTCBalance();
      }).then(function(result) {
        returned_value = WEI2EBTC(result);
        resolve(returned_value);
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    });
  });},

  getUMCBalance: function(){
    console.log('Getting UMC balance...');
  
  
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
  
      var account = accounts[0];
  
      App.contracts.SwapContract.deployed().then(function(instance) {
        return instance.getUMCBalance();
      }).then(function(result) {
        returned_value = WEI2HAC(result)
        $('.UMCBalance').text(returned_value);
        
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  isEntity: function(){ return new Promise((resolve,reject) => {

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      console.log('checking is new user ' + account + '  .....');
      App.contracts.SwapContract.deployed().then(function(instance) {

        return instance.isEntity(account);
      }).then(function(result) {
        returned_value = result;
        resolve(returned_value);
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    });
  });},

  getDepoistedAmount: function(){ return new Promise((resolve,reject) => {

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      console.log('Getting Deposited eBTC amount of ' + account + '  .....');
      App.contracts.SwapContract.deployed().then(function(instance) {

        return instance.getEntityByAddress(account);
      }).then(function(result) {
        var id, addr, amount, updateat;
        id = result[0].c[0];
        addr = result[1];
        amount = WEI2EBTC(result[2]);
        updateat = new Date(result[3].c[0] * 1000);
        resolve(amount);
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    });
  });},

  checkApprove: function(to,amount) { return new Promise((resolve,reject) => {
    console.log('Checking approve address ' + to + 'amount ' + amount +'...');
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.EBTCToken.deployed().then(function(instance) {

        return instance.approve(to,amount);
      }).then(function(result) {
        resolve(result);
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    });
  });},

  placeDeposit:function(amount){ return new Promise((resolve, reject)=>{
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      console.log('place Depsoit  ' + amount + ' eBTC ' + '...');
      App.contracts.SwapContract.deployed().then(function(instance) {
        return instance.placeDeposit(amount);
      }).then(function(result) {
        resolve(result);
      }).catch(function(err) {
        console.log(err.message);
        reject();
      });
    });
  });}, 
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
////////////////////////////////////////////////////////////////////////       general functions   ////////////////////////////////////////////////////
function HAC2WEI(_value){
  var amount = new BigNumber(_value);
  amount = web3.toWei(amount, "ether")
  return amount;
}
function WEI2HAC(_value){
  return _value.div(10**18).toFixed(3);
}
function EBTC2WEI(_value){
  var amount = new BigNumber(_value);
  return amount.mul(10**8).toFixed(0);
}
function WEI2EBTC(_value){
  return _value.div(10**8).toFixed(3);
}
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