

export interface CTAData {
    CTAAlerts: {
      Alert: CTAAlert[]; // This is an array of CTAAlert objects
    };
}

export interface CTAAlert {
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
