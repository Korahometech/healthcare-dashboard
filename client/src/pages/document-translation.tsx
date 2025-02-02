import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Upload, Languages, FileText, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

type Document = {
  id: number;
  fileName: string;
  fileType: string;
  originalLanguage: string;
  status: string;
  createdAt: string;
};

type Translation = {
  id: number;
  documentId: number;
  targetLanguage: string;
  status: string;
  createdAt: string;
  completedAt?: string;
};

const SUPPORTED_LANGUAGES = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  ru: "Русский",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
};

export default function DocumentTranslation() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [originalLanguage, setOriginalLanguage] = useState<string>("en");
  const [targetLanguage, setTargetLanguage] = useState<string>("es");
  const { toast } = useToast();

  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["/api/medical-documents"],
    queryFn: async () => {
      const response = await fetch("/api/medical-documents");
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      return response.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/medical-documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      return response.json();
    },
    onSuccess: () => {
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const translateMutation = useMutation({
    mutationFn: async ({
      documentId,
      targetLanguage,
    }: {
      documentId: number;
      targetLanguage: string;
    }) => {
      const response = await fetch("/api/medical-documents/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId, targetLanguage }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate translation");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Translation initiated successfully. You will be notified when it's complete.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("originalLanguage", originalLanguage);

    try {
      await uploadMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleTranslate = async (documentId: number) => {
    try {
      await translateMutation.mutateAsync({
        documentId,
        targetLanguage,
      });
    } catch (error) {
      console.error("Translation failed:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Medical Document Translation</h1>
          <p className="text-muted-foreground mt-1">
            Securely translate medical documents with AI-powered accuracy
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Medical Document</DialogTitle>
              <DialogDescription>
                Upload a medical document for translation. Supported formats: PDF, DOC, DOCX
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid w-full gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Original Language</label>
                  <Select value={originalLanguage} onValueChange={setOriginalLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              {uploadProgress > 0 && (
                <Progress value={uploadProgress} className="w-full" />
              )}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingDocuments ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Original Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents?.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.fileName}</TableCell>
                  <TableCell>{SUPPORTED_LANGUAGES[doc.originalLanguage as keyof typeof SUPPORTED_LANGUAGES]}</TableCell>
                  <TableCell>{doc.status}</TableCell>
                  <TableCell>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {doc.status === "completed" && (
                      <div className="flex justify-end gap-2">
                        <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select target language" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SUPPORTED_LANGUAGES)
                              .filter(([code]) => code !== doc.originalLanguage)
                              .map(([code, name]) => (
                                <SelectItem key={code} value={code}>
                                  {name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTranslate(doc.id)}
                        >
                          <Languages className="h-4 w-4 mr-2" />
                          Translate
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}