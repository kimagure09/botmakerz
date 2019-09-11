class FlightBookingRecognizer {

    ...

    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    async executeLuisQuery(context) {
        return await this.recognizer.recognize(context);
    }

    ...

}
The dialogs -> mainDialog captures the utterance and sends it to the executeLuisQuery in the actStep method.
JavaScript

Copy
class MainDialog extends ComponentDialog {

    constructor(luisRecognizer, bookingDialog) {
        ...
        this.luisRecognizer = luisRecognizer;
        ...
    }


    ...

    /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
     */
    async actStep(stepContext) {

        ...

        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);

        switch (LuisRecognizer.topIntent(luisResult)) {
                case 'BookFlight':
                    // Extract the values for the composite entities from the LUIS result.
                    const fromEntities = this.luisRecognizer.getFromEntities(luisResult);
                    const toEntities = this.luisRecognizer.getToEntities(luisResult);

                    // Show a warning for Origin and Destination if we can't resolve them.
                    await this.showWarningForUnsupportedCities(stepContext.context, fromEntities, toEntities);

                    // Initialize BookingDetails with any entities we may have found in the response.
                    bookingDetails.destination = toEntities.airport;
                    bookingDetails.origin = fromEntities.airport;
                    bookingDetails.travelDate = this.luisRecognizer.getTravelDate(luisResult);
                    console.log('LUIS extracted these booking details:', JSON.stringify(bookingDetails));

                    // Run the BookingDialog passing in whatever details we have from the LUIS call, it will fill out the remainder.
                    return await stepContext.beginDialog('bookingDialog', bookingDetails);

                case 'GetWeather':
                    // We haven't implemented the GetWeatherDialog so we just display a TODO message.
                    const getWeatherMessageText = 'TODO: get weather flow here';
                    await stepContext.context.sendActivity(getWeatherMessageText, getWeatherMessageText, InputHints.IgnoringInput);
                    break;

                default:
                    // Catch all for unhandled intents
                    const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })`;
                    await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
                }

                return await stepContext.next();

    }

    ...

}