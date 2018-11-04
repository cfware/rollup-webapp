const errors = [];

class AVAGlobal {
	constructor() {
		window.addEventListener('error', err => {
			errors.push(err);
		});

		window.addEventListener('unhandledrejection', err => {
			errors.push(err);
		});
	}

	get errors() {
		return errors;
	}

	get coverage() {
		const cov = window.__coverage__;

		window.__coverage__ = {};

		return cov;
	}
}

window.ava = new AVAGlobal();

/* Test modules use the default export to ensure it is initialized. */
export default window.ava;
