import {
  VisConfig,
  VisQueryResponse,
  VisualizationDefinition,
  VisDimension,
  VisMeasure,
  VisData,
  MassBalanceChartMap,
  MassBalanceMeasures,
} from "./types";

export const formatType = (valueFormat: string, value: any): number => {
  if (value === 0) return 0;
  if (!value || !valueFormat) {return 0};
  switch (valueFormat) {
    case "date_time":
    case "date_date":
    case "date_month":
    case "date_quarter":
    case "date_week":
    case "date_year":
      return new Date(value).valueOf();
    default:
      return parseInt(value);
  }
};

export const handleErrors = (
  vis: VisualizationDefinition,
  res: VisQueryResponse,
  options: VisConfig
) => {
  const check = (
    group: string,
    noun: string,
    count: number,
    min: number,
    max: number
  ): boolean => {
    if (!vis.addError || !vis.clearErrors) return false;
    if (count < min) {
      vis.addError({
        title: `Not Enough ${noun}s`,
        message: `This visualization requires ${min === max ? "exactly" : "at least"
          } ${min} ${noun.toLowerCase()}${min === 1 ? "" : "s"}.`,
        group,
      });
      return false;
    }
    if (count > max) {
      vis.addError({
        title: `Too Many ${noun}s`,
        message: `This visualization requires ${min === max ? "exactly" : "no more than"
          } ${max} ${noun.toLowerCase()}${min === 1 ? "" : "s"}.`,
        group,
      });
      return false;
    }
    vis.clearErrors(group);
    return true;
  };

  const { pivots, dimensions, measure_like: measures } = res.fields;

  return (
    check(
      "pivot-req",
      "Pivot",
      pivots.length,
      options.min_pivots,
      options.max_pivots
    ) &&
    check(
      "dim-req",
      "Dimension",
      dimensions.length,
      options.min_dimensions,
      options.max_dimensions
    ) &&
    check(
      "mes-req",
      "Measure",
      measures.length,
      options.min_measures,
      options.max_measures
    )
  );
};

// const calculateExtremes = (extremes) => {
//   const { dataMin, dataMax } = extremes;
//   if (dataMin && dataMax && dataMin === dataMax) {
//     // Single sensor value or sensors readings all same
//     // Set reasonable min for range where values may be negative
//     return { dataMin: 0 - Math.abs(dataMin), dataMax: dataMax };
//   } else {
//     return extremes;
//   }
// };

/**
 * Returns tuple in the order [pivotKey[], dimensions[], measures[]]
 * @param queryResponse
 */
export const processQueryResponse = (
  queryResponse: VisQueryResponse
): [string[], VisDimension[], VisMeasure[]] => {
  let pivots = queryResponse.pivots?.map((pivot) => pivot.key);

  let dimensions = queryResponse.fields.dimensions.map((dimension) => {
    return {
      name: dimension?.name,
      type: dimension?.type,
      title: dimension.label_short.trim().replace(/\r?\n/g, ""),
    };
  });
  let measures = queryResponse.fields.measures.map((measure) => {
    return {
      name: measure.name,
      type: measure.type,
      title: measure.view_label.trim().replace(/\r?\n/g, ""),
    };
  });

  return [pivots, dimensions, measures];
};

export const getMinMaxDatetimes = (
  data: VisData,
  timeSeries: VisDimension[]
): [number, number, number] => {
  let minTime: number = 0;
  let maxTime: number = 0;
  let maxIndex: number = 0;
  data.map((datum, i) => {
    let timePoint = formatType(
      timeSeries[0]?.type,
      datum[timeSeries[0]?.name]?.value
    );
    if (!maxTime || timePoint > maxTime) {
      maxTime = timePoint;
      maxIndex = i;
      console.log(datum[timeSeries[0]?.name]);
    } else if (!minTime || timePoint < minTime) {
      minTime = timePoint;
    }
  });
  return [minTime, maxTime, maxIndex];
};
