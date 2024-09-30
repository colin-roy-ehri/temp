import { Looker, VisualizationDefinition } from "../common/types";
import {
  handleErrors,
  processQueryResponse,
} from "../common/utils";
import * as d3 from 'd3';
import { ganttOptions } from '../common/ganttOptions';

declare var looker: Looker;

interface GanttViz extends VisualizationDefinition {
  elementRef?: HTMLDivElement;
}
type LegendItem = {
  element: d3.Selection<SVGGElement, unknown, null, undefined>;
  width: number;
};


export const vis: GanttViz = {
  id: "gantt-chart",
  label: "Gantt Chart",
  // @ts-ignore
  options: ganttOptions,
  create(element, config) {
    element.className = "d3-gantt-vis";
    const style = document.createElement('style');
    style.innerHTML = `
    .d3-gantt-vis {
      font-family: 'Source Sans Pro', sans-serif;
    }
  `;
    document.head.appendChild(style);
  },
  updateAsync(data, element, config, queryResponse, details, done) {

    // const isOK: boolean = handleErrors(this, queryResponse, {
    //   min_pivots: 0,
    //   max_pivots: 0,
    //   min_dimensions: 10,
    //   max_dimensions: 10,
    //   min_measures: 0,
    //   max_measures: 0,
    // });
    // if (!isOK) {
    //   done()
    //   return;
    // }

    const { dimension_like: dimensions } = queryResponse.fields;

    // Populate the select options for dimensions
    const dimensionOptions = dimensions.map(dim => ({ [dim.label]: dim.name }));

    const optionsToSet = ['nameDim', 'startDim', 'endDim', 'ref1BandStart', 'ref1BandEnd', 'ref2BandStart', 'ref2BandEnd', 'colorCategory', 'titleColumn'];

    optionsToSet.forEach(option => {
      this.options[option].values = dimensionOptions;
    });

      console.log('optins to set', optionsToSet)
      console.log('all options',this.options)
    const colorCategory = config.colorCategory;
    if (!colorCategory) {
      // @ts-ignore
      this.trigger && this.trigger("registerOptions", this.options);
      return}
    console.log('colorCategory', colorCategory);
    const colorCategoryValues = data.map(row => row[colorCategory].value).filter((value, index, self) => self.indexOf(value) === index);
    colorCategoryValues.forEach((value, index) => {
      this.options[`colorFor${value}`] = {
        type: "string",
        label: `${value} Color`,
        display: "color",
        section: "Style",
      }
      this.options[`patternFor${value}`] = {
        type: "string",
        label: `${value} Pattern`,
        display: "select",
        values: [
          { "Solid": "solid" },
          { "Dots": "dots" },
          { "Crosshatch": "crosshatch" },
          { "Diagonal Stripes": "diagonalStripes" },
          { "Horizontal Stripes": "horizontalStripes" },
          { "Vertical Stripes": "verticalStripes" },
        ],
        section: "Style",
      }
    });
    // @ts-ignore
    this.trigger && this.trigger("registerOptions", this.options);

    const nameDim = config.nameDim || dimensions[0].name;
    const startDim = config.startDim || dimensions[1].name;
    const endDim = config.endDim || dimensions[2].name;
    const titleColumn = config.titleColumn || dimensions[0].name;
    const title = data[0][titleColumn].value || config.chartTitle || "Gantt Chart";
    const legendFontSize = config.legendFontSize || 12;

    const getColor = (category: string) => {
      return config[`colorFor${category}`] || 'black';
    }

    const getPattern = (category: string) => {
      return config[`patternFor${category}`] || 'solid';
    }

    // Group data by nameDim
    const groupedData = data.reduce((acc, row) => {
      const name = row[nameDim].value;
      if (!acc[name]) {
        // @ts-ignore
        acc[name] = [];
      }
      acc[name].push({
        name: row[nameDim].value,
        start: new Date(row[startDim].value).getTime(),
        end: new Date(row[endDim].value).getTime(),
        color: row[colorCategory] ? getColor(row[colorCategory].value) : undefined,
      });
      return acc;
    }, {});

    const categories = Object.keys(groupedData);

    // Assign yAxis index to each data point
    Object.keys(groupedData).forEach((name, index) => {
      // @ts-ignore
      groupedData[name].forEach(item => {
        item.y = index;
      });
    });

    // Clear previous SVG
    d3.select(element).selectAll("*").remove();

    // Calculate left margin width based on axis values
    const longestLabel = categories.reduce((a, b) => a.length > b.length ? a : b, '');
    const tempSvg = d3.select('body').append('svg');
    const tempText = tempSvg.append('text')
      .attr('class', 'temp-text')
      .style('font-family', "'Source Sans Pro', sans-serif")
      .style('font-size', '14px')
      .text(longestLabel);
    const labelWidth = tempText.node()?.getBBox().width || 0;
    tempSvg.remove();

    // Calculate the top margin based on the title size
    const tempTitleSvg = d3.select('body').append('svg');
    const tempTitleText = tempTitleSvg.append('text')
      .attr('class', 'temp-text')
      .style('font-family', "'Source Sans Pro', sans-serif")
      .style('font-size', `${config.titleSize || 20}px`)
      .text(title);
    const titleHeight = tempTitleText.node()?.getBBox().height || 0;
    tempTitleSvg.remove();

    // Set up SVG container
    const margin = { top: titleHeight + 10, right: 10, bottom: 38, left: labelWidth + 10 }; // Add some padding to the label width
    // const margin = { top: 34, right: 10, bottom: 38, left: labelWidth + 10 }; // Add some padding to the label width
    const width = element.clientWidth - margin.left - margin.right;
    const height = element.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(element)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", `${config.titleSize || 20}px`)
      .style("font-family", "'Source Sans Pro', sans-serif")
      .text(title);

    const defs = svg.append("defs");

    defs.append("pattern")
      .attr("id", "crosshatch")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 10)
      .attr("height", 10)
      .append("path")
      .attr("d", "M0,0 L10,10 M10,0 L0,10")
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    defs.append("pattern")
      .attr("id", "diagonalStripes")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 10)
      .attr("height", 10)
      .append("path")
      .attr("d", "M0,10 L10,0")
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    defs.append("pattern")
      .attr("id", "dots")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 5)
      .attr("height", 5)
      .append("circle")
      .attr("cx", 2.5)
      .attr("cy", 2.5)
      .attr("r", 1)
      .attr("fill", "black");

    defs.append("pattern")
      .attr("id", "horizontalStripes")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 10)
      .attr("height", 4)
      .append("path")
      .attr("d", "M0,0 L10,0")
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    defs.append("pattern")
      .attr("id", "verticalStripes")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 5)
      .attr("height", 10)
      .append("path")
      .attr("d", "M0,0 L0,10")
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    // Set up scales
    const x = d3.scaleTime()
      .domain([
        d3.min(data, d => d[startDim].value ? new Date(d[startDim].value) : null),
        d3.max(data, d => d[endDim].value ? new Date(d[endDim].value) : null)
      ].filter(d => d !== null) as Date[])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(categories)
      .range([0, height])
      .padding(0.1);

    // Add axes
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${height})`)
      // @ts-ignore
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%-H:%M")))
      .selectAll('text')
      .style("font-family", "'Source Sans Pro', sans-serif");

    svg.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style("font-family", "'Source Sans Pro', sans-serif");

  
    // Add background rectangles for alternating rows
    categories.forEach((category, index) => {
      if (index % 2 === 1) {
        svg.append("rect")
          .attr("x", 0)
          .attr("y", y(category) ?? 0)
          .attr("width", width)
          .attr("height", y.bandwidth())
          .attr("fill", config.alternateRowColor || "#f0f0f0") // Use the color from config or a default color
          .attr("opacity", 0.1); // Adjust opacity as needed
      }
    });

    // Draw bars
    svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => {
        const xPos = x(new Date(d[startDim].value));
        return xPos;
      })
      .attr("y", d => {
        const yPos = y(d[nameDim].value)?.toString() ?? '';
        return yPos;
      })
      .attr("width", d => {
        const width = x(new Date(d[endDim].value)) - x(new Date(d[startDim].value));
        return width;
      })
      .attr("height", y.bandwidth())
      // allow for color with patterns
      .attr("fill", d => getColor(d[colorCategory].value))
      .attr("rx", 3)
      .attr("fill-opacity", d => getPattern(d[colorCategory].value) === 'solid' ? 1 : 1); // Adjust opacity if pattern is used

    // Apply patterns to bars with patterns
    svg.selectAll(".bar-pattern")
      .data(data.filter(d => getPattern(d[colorCategory].value) !== 'solid'))
      .enter().append("rect")
      .attr("class", "bar-pattern")
      .attr("x", d => {
        const xPos = x(new Date(d[startDim].value));
        return xPos;
      })
      .attr("y", d => {
        const yPos = y(d[nameDim].value)?.toString() ?? '';
        return yPos;
      })
      .attr("width", d => {
        const width = x(new Date(d[endDim].value)) - x(new Date(d[startDim].value));
        return width;
      })
      .attr("height", y.bandwidth())
      .attr("fill", d => `url(#${getPattern(d[colorCategory].value)})`);


    // Add tooltips
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute") // Ensure tooltip is positioned absolutely
      .style("background-color", "white") // Add white background to tooltip
      .style("padding", "5px") // Add padding to tooltip
      .style("border", "1px solid #ccc") // Add border to tooltip
      .style("border-radius", "4px") // Add border radius to tooltip
      .style("font-family", "'Source Sans Pro', sans-serif")
      .style("font-size", "14px");

    svg.selectAll(".bar")
      .on("mouseover", function (event, d: any) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`
          <b>${config.yAxisCategories}: ${d[nameDim].value}</b><br/>
          <b>Category:</b> <span style="color: ${getColor(d[colorCategory].value)};">${d[colorCategory].value}</span><br/>
          <b>Start:</b> ${d[startDim].value}<br/>
          <b>End:</b> ${d[endDim].value}<br/>
          <b>Duration:</b> ${Math.floor((new Date(d[endDim].value).getTime() - new Date(d[startDim].value).getTime()) / 3600000)} hours ${Math.floor(((new Date(d[endDim].value).getTime() - new Date(d[startDim].value).getTime()) % 3600000) / 60000)} minutes
        `)
          .style("left", (event.pageX + 5) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function (d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    svg.selectAll(".bar-pattern")
      .on("mouseover", function (event, d: any) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`
          <b>${config.yAxisCategories}: ${d[nameDim].value}</b><br/>
          <b>Category:</b> <span style="color: ${getColor(d[colorCategory].value)};">${d[colorCategory].value}</span><br/>
          <b>Start:</b> ${d[startDim].value}<br/>
          <b>End:</b> ${d[endDim].value}<br/>
          <b>Duration:</b> ${Math.floor((new Date(d[endDim].value).getTime() - new Date(d[startDim].value).getTime()) / 3600000)} hours ${Math.floor(((new Date(d[endDim].value).getTime() - new Date(d[startDim].value).getTime()) % 3600000) / 60000)} minutes
        `)
          .style("left", (event.pageX + 5) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function (d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Add legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(0, ${height + 20})`)
      .style("font-family", "'Source Sans Pro', sans-serif") // Add font-family
      .style("font-size", legendFontSize); // Add font-size

   

    const legendItems: LegendItem[] = []
   
    // Add colorCategoryValues to legend
    colorCategoryValues.forEach((value, i) => {
      const legendItem = legend.append("g")

      const pattern = getPattern(value);
      const color = getColor(value);
      const fill = pattern === 'Solid' ? getColor(value) : `url(#${pattern})`;

      legendItem.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", color)
        .attr("radius", 3);

      // Add pattern rectangle if pattern is not 'Solid'
      if (pattern !== 'Solid') {
        legendItem.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", 20)
          .attr("height", 20)
          .attr("fill", fill)
          .attr("fill-opacity", 0.5); // Adjust opacity to show both color and pattern
      }

      const text = legendItem.append("text")
        .attr("x", 30)
        .attr("y", 15)
        .text(value)      
        .style("font-size", legendFontSize)
        .style("font-family", "'Source Sans Pro', sans-serif"); 

      // Adjust spacing based on text width
      const textWidth = text?.node()?.getBBox()?.width ?? 120;
      legendItems.push({ element: legendItem, width: textWidth + 50 }); // Store element and its width

    });
    // Calculate total width of all legend items
    const totalLegendWidth = legendItems.reduce((acc, item) => acc + item.width, 0);

    // Calculate starting x position to center legend items
    const startX = (width - totalLegendWidth) / 2;

    // Position legend items
    let currentX = startX;
    legendItems.forEach(item => {
      item.element.attr("transform", `translate(${currentX}, 0)`);
      currentX += item.width;
    });
    done()
  },

};

looker.plugins.visualizations.add(vis);

export default vis;