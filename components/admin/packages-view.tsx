"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Pencil, Trash2, Plus, Star, Search, Filter } from "lucide-react"
import { packageStorage, type ProductionPackage } from "@/lib/package-storage"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PackagesView() {
  const [packages, setPackages] = useState<ProductionPackage[]>([])
  const [filteredPackages, setFilteredPackages] = useState<ProductionPackage[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<ProductionPackage | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    features: [""],
    popular: false,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [priceFilter, setPriceFilter] = useState<string>("all")
  const [popularFilter, setPopularFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadPackages()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [packages, searchQuery, priceFilter, popularFilter])

  const loadPackages = () => {
    const allPackages = packageStorage.getAll()
    setPackages(allPackages)
  }

  const applyFilters = () => {
    let result = [...packages]

    // Apply search
    if (searchQuery.trim()) {
      result = packageStorage.search(searchQuery)
    }

    // Apply price filter
    if (priceFilter !== "all") {
      const filters: { minPrice?: number; maxPrice?: number } = {}
      if (priceFilter === "under500") {
        filters.maxPrice = 500
      } else if (priceFilter === "500to1000") {
        filters.minPrice = 500
        filters.maxPrice = 1000
      } else if (priceFilter === "over1000") {
        filters.minPrice = 1000
      }
      result = result.filter((pkg) => {
        if (filters.minPrice !== undefined && pkg.price < filters.minPrice) return false
        if (filters.maxPrice !== undefined && pkg.price > filters.maxPrice) return false
        return true
      })
    }

    // Apply popular filter
    if (popularFilter === "popular") {
      result = result.filter((pkg) => pkg.popular)
    } else if (popularFilter === "regular") {
      result = result.filter((pkg) => !pkg.popular)
    }

    setFilteredPackages(result)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setPriceFilter("all")
    setPopularFilter("all")
  }

  const handleCreate = () => {
    setEditingPackage(null)
    setFormData({ name: "", price: "", features: [""], popular: false })
    setIsDialogOpen(true)
  }

  const handleEdit = (pkg: ProductionPackage) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      price: pkg.price.toString(),
      features: pkg.features,
      popular: pkg.popular || false,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this package?")) {
      packageStorage.delete(id)
      loadPackages()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const packageData = {
      name: formData.name,
      price: Number.parseFloat(formData.price),
      features: formData.features.filter((f) => f.trim() !== ""),
      popular: formData.popular,
    }

    if (editingPackage) {
      packageStorage.update(editingPackage.id, packageData)
    } else {
      packageStorage.create(packageData)
    }

    setIsDialogOpen(false)
    loadPackages()
  }

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] })
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData({ ...formData, features: newFeatures })
  }

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    setFormData({ ...formData, features: newFeatures })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Production Packages</h2>
          <p className="text-sm text-muted-foreground">Manage your production packages and pricing</p>
        </div>
        <Button onClick={handleCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Package
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search packages by name or features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-border text-foreground"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="grid gap-4 md:grid-cols-3 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label className="text-foreground">Price Range</Label>
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="All prices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All prices</SelectItem>
                      <SelectItem value="under500">Under $500</SelectItem>
                      <SelectItem value="500to1000">$500 - $1000</SelectItem>
                      <SelectItem value="over1000">Over $1000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Package Type</Label>
                  <Select value={popularFilter} onValueChange={setPopularFilter}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="All packages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All packages</SelectItem>
                      <SelectItem value="popular">Popular only</SelectItem>
                      <SelectItem value="regular">Regular only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="w-full border-border text-foreground bg-transparent"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredPackages.length} of {packages.length} packages
              </span>
              {(searchQuery || priceFilter !== "all" || popularFilter !== "all") && (
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  Filters active
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPackages.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No packages found matching your criteria</p>
            <Button variant="link" onClick={resetFilters} className="mt-2">
              Clear filters
            </Button>
          </div>
        ) : (
          filteredPackages.map((pkg) => (
            <Card key={pkg.id} className="border-border bg-card relative">
              {pkg.popular && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-foreground flex justify-between items-start">
                  <span>{pkg.name}</span>
                  <span className="text-primary text-2xl">${pkg.price}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(pkg)}
                    className="flex-1 border-border text-foreground hover:bg-foreground/10"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pkg.id)}
                    className="border-destructive text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingPackage ? "Edit Package" : "Create New Package"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingPackage ? "Update the package details below" : "Add a new production package to your offerings"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Package Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Premium Package"
                required
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-foreground">
                Price ($)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="399"
                required
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Features</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFeature}
                  className="border-border bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Feature
                </Button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="e.g., 1 hr studio rental"
                      className="bg-background border-border text-foreground"
                    />
                    {formData.features.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeFeature(index)}
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="popular"
                checked={formData.popular}
                onCheckedChange={(checked) => setFormData({ ...formData, popular: checked as boolean })}
              />
              <Label htmlFor="popular" className="text-foreground cursor-pointer">
                Mark as popular package
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-border text-foreground"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {editingPackage ? "Update Package" : "Create Package"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
