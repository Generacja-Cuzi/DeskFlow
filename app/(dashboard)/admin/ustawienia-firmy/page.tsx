"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Building2,
  Palette,
  Upload,
  Save,
  Settings,
  Trash2,
} from "lucide-react"
import { useBranding } from "@/lib/contexts/branding-context"

export default function CompanySettingsPage() {
  const { branding, updateBranding } = useBranding()
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  
  // Local state for form
  const [formData, setFormData] = useState({
    name: branding.name,
    logo: branding.logo,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    textColor: branding.textColor || "#111827",
    activeButtonTextColor: branding.activeButtonTextColor || "#ffffff",
    description: branding.description || "",
    website: branding.website || "",
    address: branding.address || "",
    phone: branding.phone || "",
  })

  useEffect(() => {
    setFormData({
      name: branding.name,
      logo: branding.logo,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      textColor: branding.textColor || "#111827",
      activeButtonTextColor: branding.activeButtonTextColor || "#ffffff",
      description: branding.description || "",
      website: branding.website || "",
      address: branding.address || "",
      phone: branding.phone || "",
    })
  }, [branding])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    
    try {
      await updateBranding(formData)
      setSaveMessage("Zapisano zmiany.")
    } catch (error) {
      console.error("Error saving settings:", error)
      setSaveMessage("Nie udalo sie zapisac zmian.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = () => {
    // Create a file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Convert to base64
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setFormData(prev => ({ ...prev, logo: result }))
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: undefined }))
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Building2 className="h-7 w-7 text-primary" />
            Ustawienia firmy
          </h1>
          <p className="text-muted-foreground mt-1">
            Zarządzaj ustawieniami i personalizacją swojej firmy
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
        </Button>
      </div>

      {saveMessage && (
        <p className="mb-4 text-sm text-muted-foreground">{saveMessage}</p>
      )}

      <div className="w-full">
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10 gap-1 sm:gap-0">
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="general">Informacje ogólne</TabsTrigger>
            <TabsTrigger value="advanced">Zaawansowane</TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Personalizacja i branding
                </CardTitle>
                <CardDescription>
                  Dostosuj wygląd swojej firmy w systemie DeskFlow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Section */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Logo firmy</Label>
                    <p className="text-sm text-muted-foreground">
                      Załaduj logo swojej firmy (zalecany format: PNG, maksymalny rozmiar: 2MB)
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <Avatar className="h-20 w-20">
                      {formData.logo ? (
                        <AvatarImage src={formData.logo} className="object-contain" />
                      ) : (
                        <AvatarFallback 
                          style={{ backgroundColor: formData.primaryColor }} 
                          className="text-white text-2xl font-semibold"
                        >
                          {formData.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={handleLogoUpload}
                      >
                        <Upload className="h-4 w-4" />
                        {formData.logo ? "Zmień logo" : "Załaduj logo"}
                      </Button>
                      {formData.logo && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Usuń logo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Colors Section */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Kolory firmowe</Label>
                    <p className="text-sm text-muted-foreground">
                      Wybierz kolory, które będą reprezentować Twoją firmę w systemie
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                    <div className="space-y-3">
                      <Label>Kolor główny</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={formData.primaryColor}
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          className="flex-1"
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Kolor dodatkowy</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={formData.secondaryColor}
                          onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                          className="flex-1"
                          placeholder="#10b981"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Kolor tekstu</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.textColor}
                          onChange={(e) => handleInputChange('textColor', e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={formData.textColor}
                          onChange={(e) => handleInputChange('textColor', e.target.value)}
                          className="flex-1"
                          placeholder="#111827"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Tekst klikniętego przycisku</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.activeButtonTextColor}
                          onChange={(e) => handleInputChange('activeButtonTextColor', e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={formData.activeButtonTextColor}
                          onChange={(e) => handleInputChange('activeButtonTextColor', e.target.value)}
                          className="flex-1"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Color Preview */}
                  <Card className="bg-muted/30">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Podgląd kolorów</Label>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <div 
                              className="h-16 rounded-lg border-2 border-white shadow-sm flex items-center justify-center"
                              style={{ backgroundColor: formData.primaryColor }}
                            >
                              <span className="text-white font-medium text-sm">Kolor główny</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div 
                              className="h-16 rounded-lg border-2 border-white shadow-sm flex items-center justify-center"
                              style={{ backgroundColor: formData.secondaryColor }}
                            >
                              <span className="text-white font-medium text-sm">Kolor dodatkowy</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div
                              className="h-16 rounded-lg border-2 border-border shadow-sm flex items-center justify-center bg-background"
                            >
                              <span className="font-medium text-sm" style={{ color: formData.textColor }}>
                                Kolor tekstu
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div
                              className="h-16 rounded-lg shadow-sm flex items-center justify-center"
                              style={{ backgroundColor: formData.primaryColor }}
                            >
                              <span className="font-medium text-sm" style={{ color: formData.activeButtonTextColor }}>
                                Tekst aktywnego przycisku
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Kolory zostaną zastosowane na całej stronie po zapisaniu zmian
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Information Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Informacje ogólne
                </CardTitle>
                <CardDescription>
                  Podstawowe informacje o firmie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label>Nazwa firmy</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nazwa firmy"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Strona internetowa</Label>
                    <Input
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Opis firmy</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Krótki opis działalności firmy"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label>Adres</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Adres siedziby firmy"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+48 123 456 789"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Ustawienia zaawansowane</CardTitle>
                <CardDescription>
                  Zaawansowane opcje konfiguracji
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Eksport danych</p>
                      <p className="text-sm text-muted-foreground">
                        Pobierz dane swojej firmy w formacie JSON
                      </p>
                    </div>
                    <Button variant="outline">Eksportuj</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Integracje</p>
                      <p className="text-sm text-muted-foreground">
                        Zarządzaj integracjami z zewnętrznymi systemami
                      </p>
                    </div>
                    <Button variant="outline">Konfiguruj</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Powiadomienia</p>
                      <p className="text-sm text-muted-foreground">
                        Ustawienia powiadomień dla całej firmy
                      </p>
                    </div>
                    <Button variant="outline">Zarządzaj</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Reset ustawień</p>
                      <p className="text-sm text-muted-foreground">
                        Przywróć domyślne ustawienia brandingu
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          name: "DeskFlow",
                          logo: undefined,
                          primaryColor: "#3b82f6",
                          secondaryColor: "#10b981",
                          description: "",
                          website: "",
                          address: "",
                          phone: "",
                        })
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}