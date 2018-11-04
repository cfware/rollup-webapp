import {Builder} from 'selenium-webdriver';
import geckodriver from 'selenium-webdriver/firefox';
import {setupTesting} from './helpers/pages';

const geckoOptions = new geckodriver.Options()
	.windowSize({height: 640, width: 640})
	.headless();
setupTesting(new Builder()
	.forBrowser('firefox')
	.setFirefoxOptions(geckoOptions)
);
