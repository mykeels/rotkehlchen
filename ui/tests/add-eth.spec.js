// Nice overview for electron tests with the chai.should model:
// https://dzone.com/articles/write-automated-tests-for-electron-with-spectron-m

const {
    path, chai, Application, electronPath
} = require('./utils/setup')

const guid = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

describe('User Settings', function () {
  this.timeout(30000);

  beforeEach(function () {
    this.app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '../..')]
    });
      return this.app.start();
  });

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
        return this.app.stop();
    }
  });

  it('Going to the user settings, adding an ethereum account and looking at its balance', async function () {
    const username = guid()
    const password = process.env.PASSWORD
    const ethAddress = process.env.ETH_ADDRESS

    // wait for sign-in / create-new-account modal
    this.app.client.waitForExist('.jconfirm-box-container', 5000).should.eventually.equal(true);

    // choose create-new-account
    await this.app.client.click('button.create-new-account')

    // fill values
    await this.app.client.addValue('#user_name_entry', username)
    await this.app.client.addValue('#password_entry', password)
    await this.app.client.addValue('#repeat_password_entry', password)

    // click create-new-account
    await this.app.client.waitForExist('.jconfirm-buttons>button', 5000)
    await this.app.client.click('.jconfirm-buttons>button')

    // wait for popup modal, then close it
    await this.app.client.waitForExist('.jconfirm-box.jconfirm-type-green.jconfirm-type-animated', 5000)
    await this.app.client.execute(function () {
        $('.jconfirm').remove()
    })
    
    // open dropdown menu
    await this.app.client.click('li#user-dropdown.dropdown')

    // make sure dropdown menu is open
    this.app.client.waitForExist('li.dropdown.open', 5000).should.eventually.equal(true)
    
    await this.app.client.execute(function () {
        // remove all modals
        $('.jconfirm').remove()
    })
    await this.app.client.click('li#user_settings_button')

    await this.app.client.execute(function () {
        $('body').css('overflow', 'scroll')
        $('#account_entry')[0].scrollIntoView()
    })
    await this.app.client.waitForExist('#blockchain_per_asset_table_body td.dataTables_empty')

    await this.app.client.execute(function () {
        // remove all modals
        $('.jconfirm').remove()
    })
    await this.app.client.addValue('#account_entry', ethAddress)
    await this.app.client.click('#add_account_button')


    await this.app.client.waitForExist('#blockchain_per_asset_table_body td.sorting_1', 20000)

    this.app.client.getText('#blockchain_per_asset_table_body td.sorting_1').should.eventually.equal('0.00')
  });

});