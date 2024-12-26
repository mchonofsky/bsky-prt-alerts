
interface MetraText {
    text: string,
    language: string
}

export interface MetraAlert {
    url: {translation: [{text: string}]},
    informed_entity: Array<{agency_id: string, route_id: string}>,
    active_period: Array<{start: {low: string}, end: {low: string}}>,
    header_text: { translation: Array<MetraText> },
    description_text: { translation: Array<MetraText> }

}
export interface MetraData {
    id: string,
    is_deleted: Boolean,
    alert: MetraAlert
}
export interface CTAData {
    CTAAlerts: {
      Alert: CTAAlert[]; // This is an array of CTAAlert objects
    };
}

export interface CTAAlert {
  Agency: string;
  AlertId: string;
  Headline: string;
  ShortDescription: string;
  FullDescription: { '#cdata-section': string };
  SeverityScore: string;
  SeverityColor: string;
  SeverityCSS: string;
  Impact: string;
  EventStart: string;
  EventEnd: string | null;
  TBD: string;
  MajorAlert: string;
  AlertURL: { '#cdata-section': string };
  ImpactedService: { Service: any[] }; // You might want to define a more specific interface for Service
  ttim: string;
  GUID: string;
}
