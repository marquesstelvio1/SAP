import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saptm/ui";
import {
  reservationPurposeLabels,
  resolveSlotStatusVariant,
  resourceTypeLabels,
  slotStatusLabels,
} from "../../lib/capacity";

export type CapacitySlotSummary = {
  id: string;
  slotReference: string;
  resourceCode: string;
  resourceType: string;
  locationName: string;
  windowStartAt: string;
  windowEndAt: string;
  capacityUnits: number;
  availableUnits: number;
  status: string;
};

export type CapacityReservationSummary = {
  id: string;
  reservationReference: string;
  cargoReference: string;
  reservationPurpose: string;
  status: string;
  reservedUnits: number;
};

export type CapacitySlotsReservationsProps = {
  upcomingSlots: CapacitySlotSummary[];
  recentReservations: CapacityReservationSummary[];
};

export function CapacitySlotsReservations({
  upcomingSlots,
  recentReservations,
}: CapacitySlotsReservationsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <Card>
        <CardHeader>
          <CardTitle>Slots operacionais</CardTitle>
          <CardDescription>Proximas janelas operacionais para capacidade.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Slots operacionais">
            <TableHeader>
              <TableRow>
                <TableHead>Slot</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>Janela</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingSlots.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={5} role="status">
                    Sem slots abertos ou historicos registados.
                  </TableCell>
                </TableRow>
              ) : (
                upcomingSlots.map((slot) => (
                  <TableRow key={slot.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{slot.slotReference}</span>
                        <span className="text-muted-foreground text-xs">{slot.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{slot.resourceCode}</span>
                        <span className="text-muted-foreground text-xs">
                          {resourceTypeLabels[slot.resourceType as keyof typeof resourceTypeLabels]}{" "}
                          · {slot.locationName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {slot.windowStartAt} &rarr; {slot.windowEndAt}
                    </TableCell>
                    <TableCell>
                      <Badge variant={slot.availableUnits > 0 ? "success" : "warning"}>
                        {slot.availableUnits}/{slot.capacityUnits}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={resolveSlotStatusVariant(
                          slot.status as keyof typeof slotStatusLabels,
                        )}
                      >
                        {slotStatusLabels[slot.status as keyof typeof slotStatusLabels]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reservas recentes</CardTitle>
          <CardDescription>Historico de reservas e cancelamentos auditaveis.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table aria-label="Reservas recentes">
            <TableHeader>
              <TableRow>
                <TableHead>Reserva</TableHead>
                <TableHead>Carga</TableHead>
                <TableHead>Finalidade</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReservations.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={4} role="status">
                    Sem reservas registadas.
                  </TableCell>
                </TableRow>
              ) : (
                recentReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span>{reservation.reservationReference}</span>
                        <span className="text-muted-foreground text-xs">
                          {reservation.reservedUnits} unidade(s)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{reservation.cargoReference}</TableCell>
                    <TableCell>
                      {
                        reservationPurposeLabels[
                          reservation.reservationPurpose as keyof typeof reservationPurposeLabels
                        ]
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={reservation.status === "reserved" ? "success" : "outline"}>
                        {reservation.status === "reserved" ? "Reservada" : "Cancelada"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
