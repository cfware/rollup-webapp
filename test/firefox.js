import {Builder} from 'selenium-webdriver';
import geckodriver from 'selenium-webdriver/firefox';
import {setupTesting} from './helpers/pages';

setupTesting(__filename, new Builder()
	.forBrowser('firefox')
	.setFirefoxOptions(new geckodriver.Options().headless())
);
