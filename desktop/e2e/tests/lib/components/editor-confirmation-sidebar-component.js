const webdriver = require( 'selenium-webdriver' );
const AsyncBaseContainer = require( '../async-base-container.js' );
const driverHelper = require( '../driver-helper.js' );

const by = webdriver.By;

class EditorConfirmationSidebarComponent extends AsyncBaseContainer {
	constructor( driver ) {
		super( driver, by.css( '.editor-confirmation-sidebar.is-active' ) );
	}

	async confirmAndPublish() {
		await driverHelper.waitTillPresentAndDisplayed(
			this.driver,
			by.css( '.editor-confirmation-sidebar__action button.button' )
		);
		return await driverHelper.clickWhenClickable(
			this.driver,
			by.css( '.editor-confirmation-sidebar__action button.button' )
		);
	}
}

module.exports = EditorConfirmationSidebarComponent;
