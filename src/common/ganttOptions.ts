export const ganttOptions = {

    titleColumn: {
        type: "string",
        label: "Title Column",
        display: "select",
        values: [],
        section: "Style",
    },
    chartTitle: {
        type: "string",
        label: "Chart Title",
        display: "text",
        section: "Style",
    },
    titleSize: {
        type: "string",
        label: "Title Size",
        display: "text",
        section: "Style",
        default: "20",
    },
    alternateRowColor: {
        type: "array",
        label: "Alternate Row Color",
        display: "color",
        section: "Style",
    },
    yAxisCategories: {
        type: "array",
        label: "Y-Axis Categories",
        display: "text",
        section: "Style",
    },

    nameDim: {
        type: "string",
        label: "Name Dimension",
        display: "select",
        values: [],
        section: "Data",
    },
    startDim: {
        type: "string",
        label: "Start Dimension",
        display: "select",
        values: [],
        section: "Data",
    },
    endDim: {
        type: "string",
        label: "End Dimension",
        display: "select",
        values: [],
        section: "Data",
    },
    colorCategory: {
        type: "string",
        label: "Color By Category",
        display: "select",
        values: [],
        section: "Data",
    },
    legendFontSize: {
        type: "string",
        label: "Legend Font Size",
        display: "text",
        section: "Style",
        default: "12",
    },
}