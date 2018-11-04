import {Builder} from 'selenium-webdriver';
import chromedriver from 'selenium-webdriver/chrome';
import {setupTesting} from './helpers/pages';

setupTesting(__filename, new Builder()
	.forBrowser('chrome')
	.setChromeOptions(new chromedriver.Options().headless())
);
