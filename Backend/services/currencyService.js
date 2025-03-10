import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_URL = process.env.EXCHANGE_RATE_API_URL;
const BASE_CURRENCY = process.env.BASE_CURRENCY;

// Function to convert any currency to the base currency
export const convertToBaseCurrency = async (amount, currency) => {
    try {
        if (currency === BASE_CURRENCY) return amount; // No conversion needed

        const url = `${BASE_URL}/${API_KEY}/latest/${BASE_CURRENCY}`;
        console.log(`Fetching exchange rate for: ${currency} → ${BASE_CURRENCY}`);

        const response = await axios.get(url);

        if (!response.data || !response.data.conversion_rates || !response.data.conversion_rates[currency]) {
            throw new Error(`Exchange rate for ${currency} not found.`);
        }

        const exchangeRate = response.data.conversion_rates[currency];
        const convertedAmount = amount / exchangeRate; // Convert to base currency

        console.log(`Converted ${amount} ${currency} → ${convertedAmount.toFixed(2)} ${BASE_CURRENCY}`);
        return parseFloat(convertedAmount.toFixed(2)); // Round to 2 decimal places
    } catch (error) {
        console.error("Currency Conversion Error:", error.message);
        throw new Error("Failed to fetch exchange rates.");
    }
};

// Function to convert from the base currency to any other currency
export const convertFromBaseCurrency = async (amount, currency) => {
    try {
        if (currency === BASE_CURRENCY) return amount; // No conversion needed

        const url = `${BASE_URL}/${API_KEY}/latest/${BASE_CURRENCY}`;
        console.log(`Fetching exchange rate for: ${BASE_CURRENCY} → ${currency}`);

        const response = await axios.get(url);

        if (!response.data || !response.data.conversion_rates || !response.data.conversion_rates[currency]) {
            throw new Error(`Exchange rate for ${currency} not found.`);
        }

        const exchangeRate = response.data.conversion_rates[currency]; // Get LKR → target currency rate
        const convertedAmount = amount * exchangeRate; // Convert from LKR to target currency

        console.log(`Converted ${amount} ${BASE_CURRENCY} → ${convertedAmount.toFixed(2)} ${currency}`);
        return parseFloat(convertedAmount.toFixed(2)); // Round to 2 decimal places
    } catch (error) {
        console.error("Currency Conversion Error:", error.message);
        throw new Error("Failed to fetch exchange rates.");
    }
};