
export interface PRTData {
    'bustime-response': {
      sb: PRTAlert[]; // This is an array of PRTAlert objects
    };
}

export interface PRTAlert {
  nm: string;
  sbj: string;
  dtl: string;
  brf: string;
  prty: string;
  rtpidatafeed: string;
  srvc: Array<{rt: string, rtdir: string, stpid: string, stpnm: string}>;
  mod: string;
  url: string;
}