using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class PicturePoint
{
    [Required]
    public Guid PictureId { get; set; }
    
    [Required]
    public Guid PointId { get; set; }
    
    [ForeignKey("PictureId")]
    [JsonIgnore]
    public Picture? Picture { get; set; }
    
    [ForeignKey("PointId")]
    [JsonIgnore]
    public Point? Point { get; set; }
}
