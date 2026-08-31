export interface ItemPackageRandomOptionItem {
  Item: string | number;
  Rate: number;
}

export interface ItemPackageRandomOptions {
  Count: number;
  List: ItemPackageRandomOptionItem[];
}

export interface ItemPackageGroupItem {
  Item: string | number;
  Amount?: number;
  Rate?: number;
  RentalHours?: number;
  Refine?: number;
  RandomOptionGroup?: string;
}

export interface ItemPackageGroup {
  Group?: number;
  Index?: number;
  Count?: number;
  Items?: ItemPackageGroupItem[];
  List?: ItemPackageGroupItem[];
}

export interface ItemPackageRawFields {
  Package?: string;
  Item?: string;
  RandomOptions?: ItemPackageRandomOptions;
  Groups?: ItemPackageGroup[];
}
