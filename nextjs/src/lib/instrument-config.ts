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

const pipelineIdsAfgSeries: PipelineIdsSeries = {
    "AFG1000": ["fppfqitpyd", "d2wqds0m3e"],
};

const pipelineIdsDmmSeries: PipelineIdsSeries = {
    "DMM2000": ["fppfqitpyd", "d2wqds0m3e"],
};

const pipelineIdsPwrSeries: PipelineIdsSeries = {
    "PWR1000": ["fppfqitpyd", "d2wqds0m3e"],
};

export const instrumentType: Record<string, InstrumentType> = {
    "OSC": { name: "示波器", pipelineIds: pipelineIdsOscSeries },
    "AFG": { name: "信号发生器", pipelineIds: pipelineIdsAfgSeries },
    "DMM": { name: "万用表", pipelineIds: pipelineIdsDmmSeries },
    "PWR": { name: "电源", pipelineIds: pipelineIdsPwrSeries },
}; 