import localFont from "next/font/local";


export const fontSirwan = localFont({
    src: [
        {
            path: "./UniSIRWAN Expo Light.ttf",
            weight: "300",
            style: "normal",
        },
        {
            path: "./UniSIRWAN Expo Regular.ttf",
            weight: "400",
            style: "normal",
        },
        {
            path: "./UniSIRWAN Expo Medium.ttf",
            weight: "500",
            style: "normal",
        },
        {
            path: "./UniSIRWAN Expo Bold.ttf",
            weight: "700",
            style: "normal",
        },
    ],
    variable: "--font-sirwan",
    display: "swap",
})