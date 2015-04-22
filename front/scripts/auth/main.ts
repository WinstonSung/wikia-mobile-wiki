window.document.addEventListener('DOMContentLoaded', function ():void {
	var formElement: HTMLFormElement = <HTMLFormElement> window.document.querySelector('form'),
		birthdateContainer: HTMLElement = <HTMLElement> formElement.querySelector('.birthdate-container');

	if (birthdateContainer) {
		new BirthdateInput(birthdateContainer, formElement).init();
	}

	new Form(formElement).watch();
	new SubmitValidator(formElement).watch();
});
