export class PropertyMapper {
  static toDTO(pg: any) {
    return {
      id: pg.id,
      name: pg.name,
      slug: pg.slug,
      logo: pg.logo,
      address: pg.address,
      city: pg.city,
      pincode: pg.pincode,
      rentStartingFrom: pg.rentStartingFrom,
      availableBeds: pg.availableBeds,
      status: pg.status
    };
  }
}
