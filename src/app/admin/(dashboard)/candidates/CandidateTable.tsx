"use client"

import { useState, useRef } from "react"
import { addCandidate, updateCandidate, deleteCandidate, uploadCandidatePhoto } from "@/app/actions/candidateAdmin"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Edit, Loader2, Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

type Innovation = { name: string; explanation: string[] }

type Candidate = {
  id: string
  candidateNumber: number
  name: string
  photoUrl: string | null
  cvUrl: string | null
  grandDesignUrl: string | null
  vision: string
  missions: string[]
  innovations: Innovation[]
}

export function CandidateTable({ candidates }: { candidates: Candidate[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [currentId, setCurrentId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    candidateNumber: 1,
    name: "",
    photoUrl: "",
    cvUrl: "",
    grandDesignUrl: "",
    vision: "",
    missions: [] as string[],
    innovations: [] as Innovation[]
  })

  const handleOpenNew = () => {
    setIsEdit(false)
    setUploadError("")
    setFormData({
      candidateNumber: candidates.length + 1,
      name: "",
      photoUrl: "",
      cvUrl: "",
      grandDesignUrl: "",
      vision: "",
      missions: [""],
      innovations: []
    })
    setIsOpen(true)
  }

  const handleOpenEdit = (c: Candidate) => {
    setIsEdit(true)
    setCurrentId(c.id)
    setUploadError("")
    setFormData({
      candidateNumber: c.candidateNumber,
      name: c.name,
      photoUrl: c.photoUrl || "",
      cvUrl: c.cvUrl || "",
      grandDesignUrl: c.grandDesignUrl || "",
      vision: c.vision,
      missions: c.missions,
      innovations: c.innovations,
    })
    setIsOpen(true)
  }

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    setDeleteTarget(id)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsLoading(true)
    try {
      const res = await deleteCandidate(deleteTarget)
      if (res.success) {
        toast.success("Berhasil menghapus kandidat")
      } else {
        toast.error(res.error || "Gagal menghapus kandidat")
      }
    } catch {
      toast.error("Gagal menghapus kandidat. Coba lagi.")
    } finally {
      setIsLoading(false)
      setDeleteTarget(null)
    }
  }

  const handleFileSelect = async (file: File) => {
    setUploadError("")

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Format tidak didukung. Gunakan JPG, PNG, atau WebP.")
      return
    }

    // Validate file size (6MB)
    if (file.size > 6 * 1024 * 1024) {
      setUploadError("Ukuran file terlalu besar. Maksimal 6MB.")
      return
    }

    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const result = await uploadCandidatePhoto(fd)

      if (result.success) {
        setFormData(prev => ({ ...prev, photoUrl: result.url }))
      } else {
        setUploadError(result.error)
      }
    } catch {
      setUploadError("Gagal mengupload foto. Coba lagi.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photoUrl: "" }))
    setUploadError("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Nama lengkap wajib diisi.")
      return
    }
    if (!formData.photoUrl) {
      toast.error("Foto kandidat wajib diupload.")
      return
    }
    if (!formData.cvUrl.trim()) {
      toast.error("CV URL wajib diisi dengan link Google Drive.")
      return
    }
    if (!formData.grandDesignUrl.trim()) {
      toast.error("Grand Design URL wajib diisi dengan link Google Drive.")
      return
    }
    if (!formData.vision.trim()) {
      toast.error("Visi wajib diisi.")
      return
    }
    if (formData.missions.filter(m => m.trim() !== "").length === 0) {
      toast.error("Minimal harus mengisi 1 misi.")
      return
    }

    const payload = {
      ...formData,
      missions: formData.missions.filter(m => m.trim() !== ""),
      innovations: formData.innovations.filter(i => i.name.trim() !== "")
    }

    setIsLoading(true)
    try {
      let res
      if (isEdit) {
        res = await updateCandidate(currentId, payload)
      } else {
        res = await addCandidate(payload)
      }

      if (res.success) {
        toast.success(isEdit ? "Berhasil memperbarui kandidat" : "Berhasil menambah kandidat")
        setIsOpen(false)
      } else {
        toast.error(res.error || "Gagal menyimpan kandidat")
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan kandidat.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleOpenNew}>Tambah Kandidat</Button>

      <Table className="bg-card rounded-md shadow-sm border">
        <TableHeader>
          <TableRow>
            <TableHead>No. Urut</TableHead>
            <TableHead>Foto</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Visi</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.candidateNumber}</TableCell>
              <TableCell>
                {c.photoUrl ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted">
                    <Image
                      src={c.photoUrl}
                      alt={c.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="max-w-[200px] truncate">{c.vision}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleOpenEdit(c)} disabled={isLoading}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(c.id)} disabled={isLoading}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {candidates.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Belum ada kandidat.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-5xl w-[90vw] h-[85vh] flex flex-col gap-0 p-6 overflow-hidden">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle>{isEdit ? "Edit Kandidat" : "Tambah Kandidat"}</DialogTitle>
          </DialogHeader>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto py-4 pr-2 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
              {/* Left Column: Core Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nomor Urut</Label>
                    <Input type="number" value={formData.candidateNumber} onChange={e => setFormData({ ...formData, candidateNumber: parseInt(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label>Foto Kandidat</Label>
                  {formData.photoUrl ? (
                    <div className="flex items-start gap-4">
                      <div className="relative w-28 h-28 rounded-lg overflow-hidden border bg-muted shrink-0">
                        <Image
                          src={formData.photoUrl}
                          alt="Preview"
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      </div>
                      <div className="flex flex-col gap-2 pt-1">
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          Foto berhasil diupload
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Ganti Foto
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemovePhoto}
                            disabled={isUploading}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${isUploading
                        ? "border-primary/50 bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <p className="text-sm text-muted-foreground">Mengupload foto...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-sm font-medium">Klik atau seret foto ke sini</p>
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, atau WebP • Maks. 5MB</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                  />
                  {uploadError && (
                    <p className="text-sm text-destructive">{uploadError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    CV URL (Google Drive) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={formData.cvUrl}
                    onChange={e => setFormData({ ...formData, cvUrl: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">Harus berupa link shareable Google Drive</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Grand Design URL (Google Drive) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={formData.grandDesignUrl}
                    onChange={e => setFormData({ ...formData, grandDesignUrl: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">Harus berupa link shareable Google Drive</p>
                </div>

                <div className="space-y-2">
                  <Label>Visi</Label>
                  <textarea
                    className="w-full flex min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                    value={formData.vision}
                    onChange={e => setFormData({ ...formData, vision: e.target.value })}
                  />
                </div>
              </div>

              {/* Right Column: Missions & Innovations */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Misi</Label>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 border p-3 rounded-md bg-muted/5 shadow-inner">
                    {formData.missions.map((mission, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input placeholder={`Misi ke-${idx + 1}`} value={mission} onChange={e => {
                          const newMissions = [...formData.missions]
                          newMissions[idx] = e.target.value
                          setFormData({ ...formData, missions: newMissions })
                        }} />
                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => {
                          const newMissions = formData.missions.filter((_, i) => i !== idx)
                          setFormData({ ...formData, missions: newMissions })
                        }}>
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {formData.missions.length === 0 && (
                      <p className="text-sm text-muted-foreground italic text-center py-2">Belum ada misi yang ditambahkan.</p>
                    )}
                  </div>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => setFormData({ ...formData, missions: [...formData.missions, ""] })}>Tambah Misi</Button>
                </div>

                <div className="space-y-2">
                  <Label>Inovasi</Label>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 border p-3 rounded-md bg-muted/5 shadow-inner">
                    {formData.innovations.map((inov, idx) => (
                      <div key={idx} className="space-y-2 mb-4 border pb-3 p-3 rounded bg-card relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-6 w-6 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            const newInov = formData.innovations.filter((_, i) => i !== idx)
                            setFormData({ ...formData, innovations: newInov })
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                        <Label className="text-xs font-semibold">Inovasi #{idx + 1}</Label>
                        <Input placeholder="Nama Inovasi" value={inov.name} onChange={e => {
                          const newInov = [...formData.innovations]
                          newInov[idx].name = e.target.value
                          setFormData({ ...formData, innovations: newInov })
                        }} />
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Penjelasan (Poin-poin)</Label>
                          {inov.explanation.map((expl, eIdx) => (
                            <div key={eIdx} className="flex gap-1 mb-1">
                              <Input className="h-8 text-xs" placeholder="Detail penjelasan..." value={expl} onChange={e => {
                                const newInov = [...formData.innovations]
                                newInov[idx].explanation[eIdx] = e.target.value
                                setFormData({ ...formData, innovations: newInov })
                              }} />
                              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                                const newInov = [...formData.innovations]
                                newInov[idx].explanation = newInov[idx].explanation.filter((_, i) => i !== eIdx)
                                setFormData({ ...formData, innovations: newInov })
                              }}>
                                <X className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="secondary" size="sm" className="text-xs h-7 px-2 mt-1" onClick={() => {
                            const newInov = [...formData.innovations]
                            newInov[idx].explanation.push("")
                            setFormData({ ...formData, innovations: newInov })
                          }}>+ Penjelasan</Button>
                        </div>
                      </div>
                    ))}
                    {formData.innovations.length === 0 && (
                      <p className="text-sm text-muted-foreground italic text-center py-2">Belum ada inovasi yang ditambahkan.</p>
                    )}
                  </div>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => setFormData({ ...formData, innovations: [...formData.innovations, { name: "", explanation: [""] }] })}>Tambah Inovasi</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex justify-end gap-2 border-t pt-4 bg-background">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Batal</Button>
            <Button onClick={handleSave} disabled={isLoading || isUploading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kandidat ini? Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isLoading}>Batal</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
