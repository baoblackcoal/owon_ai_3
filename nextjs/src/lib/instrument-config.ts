interface PipelineIdsSeries {
    [key: string]: string[];
}

interface InstrumentType {
    name: string;
    pipelineIds: PipelineIdsSeries;
}

const pipelineIdsOscSeries: PipelineIdsSeries = {
    "ADS800A": ["he9rcpebc3", "utmhvnxgey"],
    "ADS900A": ["fppfqitpyd", "d2wqds0m3e"],
    "ADS3000": ["fppfqitpyd", "d2wqds0m3e"],
    "ADS3000A": ["fppfqitpyd", "d2wqds0m3e"],
    "ADS4000": ["fppfqitpyd", "d2wqds0m3e"],
    "ADS4000A": ["fppfqitpyd", "d2wqds0m3e"],
};

// const pipelineIdsAfgSeries: PipelineIdsSeries = {
//     "AFG1000": ["fppfqitpyd", "d2wqds0m3e"],
// };

// const pipelineIdsDmmSeries: PipelineIdsSeries = {
//     "DMM2000": ["fppfqitpyd", "d2wqds0m3e"],
// };

// const pipelineIdsPwrSeries: PipelineIdsSeries = {
//     "PWR1000": ["fppfqitpyd", "d2wqds0m3e"],
// };

export const instrumentType: Record<string, InstrumentType> = {
    "OSC": { name: "示波器", pipelineIds: pipelineIdsOscSeries },
    // "AFG": { name: "信号发生器", pipelineIds: pipelineIdsAfgSeries },
    // "DMM": { name: "万用表", pipelineIds: pipelineIdsDmmSeries },
    // "PWR": { name: "电源", pipelineIds: pipelineIdsPwrSeries },
};

// 工具函数：获取仪器类型选项
export const getInstrumentTypeOptions = () => {
    return Object.entries(instrumentType).map(([key, value]) => ({
        value: key,
        label: value.name
    }));
};

// 工具函数：获取指定仪器类型的系列选项
export const getInstrumentSeriesOptions = (instrumentTypeKey: string) => {
    const instrument = instrumentType[instrumentTypeKey];
    if (!instrument) return [];
    
    return Object.keys(instrument.pipelineIds).map(series => ({
        value: series,
        label: series
    }));
};

// 工具函数：验证仪器类型和系列组合是否有效
export const isValidInstrumentCombination = (instrumentTypeKey: string, series: string) => {
    const instrument = instrumentType[instrumentTypeKey];
    return instrument && series in instrument.pipelineIds;
}; 