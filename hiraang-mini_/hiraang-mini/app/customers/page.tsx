"use client";

import { useEffect, useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import CustomerDialog from "@/components/CustomerDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Customer } from "@/types/inventory";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "@/lib/store";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const refresh = () => setCustomers(getCustomers());

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const handleSave = async (
    data: Omit<Customer, "id" | "createdAt" | "updatedAt">
  ) => {
    if (editing) {
      updateCustomer(editing.id, data);
    } else {
      createCustomer(data);
    }
    refresh();
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteCustomer(deleting.id);
    toast.success(`${deleting.name} deleted`);
    setDeleting(null);
    refresh();
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-teal-light to-background px-3 pb-10 pt-16 md:px-6 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-teal">Customers</h1>
              <p className="text-muted-foreground">
                Manage your customer database
              </p>
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((customer) => (
              <Card
                key={customer.id}
                className="group border-teal/20 p-6 shadow-elegant hover-lift"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10">
                      <User className="h-5 w-5 text-teal" />
                    </div>
                    <div>
                      <h3 className="font-bold text-teal">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {customer.state}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(customer);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleting(customer)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 text-teal" />
                      {customer.phone}
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 text-teal" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 text-teal" />
                      <span className="text-xs">{customer.address}</span>
                    </div>
                  )}
                  {(customer.gstin || customer.pan) && (
                    <div className="space-y-1 border-t pt-2 text-xs">
                      {customer.gstin && (
                        <p>
                          <span className="text-muted-foreground">GSTIN </span>
                          <span className="font-mono">{customer.gstin}</span>
                        </p>
                      )}
                      {customer.pan && (
                        <p>
                          <span className="text-muted-foreground">PAN </span>
                          <span className="font-mono">{customer.pan}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <Card className="col-span-full border-dashed p-12 text-center">
                <p className="mb-4 text-muted-foreground">
                  {searchQuery
                    ? "No customers match your search"
                    : "No customers yet"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => {
                      setEditing(null);
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Customer
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>

        <CustomerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          customer={editing}
        />

        <AlertDialog
          open={!!deleting}
          onOpenChange={() => setDeleting(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Delete {deleting?.name}? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
